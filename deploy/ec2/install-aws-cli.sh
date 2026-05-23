#!/usr/bin/env bash
set -euo pipefail

if command -v aws >/dev/null 2>&1; then
  aws --version
  exit 0
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/ec2/install-aws-cli.sh" >&2
  exit 1
fi

apt-get update
apt-get install -y curl unzip

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "$tmp_dir/awscliv2.zip"
unzip -q "$tmp_dir/awscliv2.zip" -d "$tmp_dir"
"$tmp_dir/aws/install" --update

aws --version
