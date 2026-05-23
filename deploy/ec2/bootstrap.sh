#!/bin/bash
# EC2 user-data script. Runs once on first boot as root.
# - Installs Docker + Compose plugin from the official Docker apt repo.
# - Adds a 2G swapfile so `next build` doesn't OOM on t3.small (2GB RAM).
# - Creates /srv/arcado for the app and the .env file.
# Target OS: Ubuntu 24.04 LTS (noble) on x86_64.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg git python3 unzip ufw

# AWS CLI is used by deploy/ec2/render-prod-env.py to pull the current RDS
# password from Secrets Manager before Docker Compose replaces containers.
if ! command -v aws >/dev/null 2>&1; then
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi

# Docker official repo.
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
usermod -aG docker ubuntu

# Swap keeps `next build` alive on a 2 GB box.
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# App dir.
mkdir -p /srv/arcado
chown ubuntu:ubuntu /srv/arcado

# Basic firewall — AWS SG is the real boundary, ufw is belt + suspenders.
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "bootstrap complete"
