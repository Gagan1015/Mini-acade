#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/ec2/install-db-secret-refresh.sh" >&2
  exit 1
fi

cat >/etc/systemd/system/arcado-db-secret-refresh.service <<'EOF'
[Unit]
Description=Refresh Arcado RDS credentials from AWS Secrets Manager
Wants=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/srv/arcado
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/bin/bash /srv/arcado/deploy/ec2/refresh-db-secret.sh
EOF

cat >/etc/systemd/system/arcado-db-secret-refresh.timer <<'EOF'
[Unit]
Description=Run Arcado RDS credential refresh

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
AccuracySec=30s
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now arcado-db-secret-refresh.timer
systemctl list-timers arcado-db-secret-refresh.timer --no-pager
