#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="${ARCADO_ROOT:-$(cd "$script_dir/../.." && pwd)}"
compose_file="${ARCADO_COMPOSE_FILE:-$repo_root/deploy/ec2/docker-compose.prod.yml}"
source_env="${ARCADO_ENV_FILE:-/srv/arcado/.env.prod}"
rendered_env="${ARCADO_RENDERED_ENV_FILE:-/srv/arcado/.env.prod.generated}"

if [[ ! -f "$source_env" && -f "$repo_root/.env.prod" ]]; then
  source_env="$repo_root/.env.prod"
fi

tmp_env="$(mktemp)"
cleanup() {
  rm -f "$tmp_env"
}
trap cleanup EXIT

python3 "$repo_root/deploy/ec2/render-prod-env.py" \
  --source "$source_env" \
  --output "$tmp_env"

echo "Checking refreshed RDS credentials..."
docker run --rm --env-file "$tmp_env" postgres:16-alpine sh -ec \
  'db_url_for_psql="$(printf "%s" "$DATABASE_URL" | sed -E "s/([?&])schema=[^&]*&?/\1/; s/[?&]$//; s/\?&/?/")"; psql "$db_url_for_psql" -v ON_ERROR_STOP=1 -Atqc "select 1" >/dev/null'

if [[ -f "$rendered_env" ]] && cmp -s "$tmp_env" "$rendered_env"; then
  echo "RDS secret is unchanged."
  exit 0
fi

install -m 600 "$tmp_env" "$rendered_env"

if docker compose -f "$compose_file" --env-file "$rendered_env" ps --services --status running | grep -Eq '^(client|server)$'; then
  echo "RDS secret changed; restarting app containers with refreshed env."
  docker compose -f "$compose_file" --env-file "$rendered_env" up -d --no-build client server
else
  echo "Rendered refreshed env; app containers are not running yet."
fi
