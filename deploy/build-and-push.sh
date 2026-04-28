#!/usr/bin/env bash
# Builds both Docker images and pushes them to Amazon ECR.
#
# Usage:
#   cp deploy/.env.deploy.example deploy/.env.deploy && edit it
#   set -a && . deploy/.env.deploy && set +a
#   ./deploy/build-and-push.sh            # builds + pushes both
#   ./deploy/build-and-push.sh client     # only client
#   ./deploy/build-and-push.sh server     # only server

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REPO_CLIENT:?ECR_REPO_CLIENT is required}"
: "${ECR_REPO_SERVER:?ECR_REPO_SERVER is required}"
: "${IMAGE_TAG:=latest}"

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
TARGET="${1:-all}"

echo "[1/3] Logging in to ECR ${REGISTRY}"
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

build_and_push() {
  local name="$1" dockerfile="$2"
  local image="${REGISTRY}/${name}:${IMAGE_TAG}"

  echo "[2/3] Building ${image}"
  local build_args=()
  if [[ "$name" == "$ECR_REPO_CLIENT" ]]; then
    build_args+=(--build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-}")
    build_args+=(--build-arg "NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL:-}")
  fi

  docker build \
    -f "$dockerfile" \
    -t "$image" \
    "${build_args[@]}" \
    .

  echo "[3/3] Pushing ${image}"
  docker push "$image"
  echo "    pushed: ${image}"
}

if [[ "$TARGET" == "all" || "$TARGET" == "client" ]]; then
  build_and_push "$ECR_REPO_CLIENT" "client/Dockerfile"
fi

if [[ "$TARGET" == "all" || "$TARGET" == "server" ]]; then
  build_and_push "$ECR_REPO_SERVER" "server/Dockerfile"
fi

echo "Done. Update your ECS services to pick up the new images:"
echo "  aws ecs update-service --cluster arcado --service arcado-client --force-new-deployment --region $AWS_REGION"
echo "  aws ecs update-service --cluster arcado --service arcado-server --force-new-deployment --region $AWS_REGION"
