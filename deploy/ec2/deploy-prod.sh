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

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is missing; installing it with sudo..."
  sudo bash "$repo_root/deploy/ec2/install-aws-cli.sh"
fi

psql_database_url='db_url_for_psql="$(printf "%s" "$DATABASE_URL" | sed -E "s/([?&])schema=[^&]*&?/\1/; s/[?&]$//; s/\?&/?/")"; psql "$db_url_for_psql" -v ON_ERROR_STOP=1 -Atqc "select 1" >/dev/null'

check_server_db_health() {
  local attempt

  for attempt in {1..12}; do
    if docker compose -f "$compose_file" \
      --env-file "$rendered_env" \
      exec -T server node -e '
const http = require("node:http")
const req = http.get(
  { host: "127.0.0.1", port: process.env.PORT || 3001, path: "/health/db", timeout: 5000 },
  (res) => {
    res.resume()
    res.on("end", () => process.exit(res.statusCode === 200 ? 0 : 1))
  }
)
req.on("timeout", () => req.destroy(new Error("timeout")))
req.on("error", (error) => {
  console.error(error.message)
  process.exit(1)
})
'; then
      return 0
    fi

    echo "Server DB health is not ready yet; retrying ($attempt/12)..."
    sleep 5
  done

  return 1
}

python3 "$repo_root/deploy/ec2/render-prod-env.py" \
  --source "$source_env" \
  --output "$rendered_env"

echo "Checking RDS credentials before replacing containers..."
docker run --rm --env-file "$rendered_env" postgres:16-alpine \
  sh -ec "$psql_database_url"

docker compose -f "$compose_file" \
  --env-file "$rendered_env" \
  up -d --build

echo "Checking server database health..."
check_server_db_health

docker image prune -f
docker compose -f "$compose_file" \
  --env-file "$rendered_env" \
  ps
