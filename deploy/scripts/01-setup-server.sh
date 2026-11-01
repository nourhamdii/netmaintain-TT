#!/usr/bin/env bash
# 5.2 - Stack de production NetMaintain (Ubuntu 24.04)
#   Nginx (reverse proxy) + Node.js (géré par systemd) + MySQL + Swap 4 Go
#
# Usage :
#   sudo REPO_URL=https://github.com/nourhamdii/netmaintain-TT.git \
#        DB_PASSWORD='UnMotDePasseSolide123' \
#        bash 01-setup-server.sh
# Optionnel : DOMAIN=mon-domaine.com (sinon le serveur répond sur toute adresse)

set -euo pipefail

: "${REPO_URL:?Définissez REPO_URL (URL GitHub du dépôt)}"
: "${DB_PASSWORD:?Définissez DB_PASSWORD (mot de passe MySQL)}"
DOMAIN="${DOMAIN:-_}"
APP_DIR=/opt/netmaintain
APP_USER=ubuntu

if [[ ! "$DB_PASSWORD" =~ ^[A-Za-z0-9_-]{12,}$ ]]; then
  echo "DB_PASSWORD invalide : 12 caractères minimum, uniquement lettres, chiffres, - et _" >&2
  exit 1
fi

echo "==> [1/7] Swap de 4 Go (prévention des crashs OOM)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [2/7] Paquets : Nginx, MySQL, Git, Node.js 22 LTS"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx git curl unzip ca-certificates mysql-server
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

echo "==> [3/7] MySQL : base et utilisateur dédié (droits limités à la base netmaintain)"
systemctl enable --now mysql
mysql <<SQL
CREATE DATABASE IF NOT EXISTS netmaintain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'netmaintain'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER 'netmaintain'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON netmaintain.* TO 'netmaintain'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> [4/7] Code de l'application depuis GitHub"
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  sudo -u "$APP_USER" git -C "$APP_DIR" pull
fi

cat > "$APP_DIR/backend/.env" <<ENV
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=netmaintain
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=netmaintain
SEED_DEMO=true
ENV
chown "$APP_USER":"$APP_USER" "$APP_DIR/backend/.env"
chmod 600 "$APP_DIR/backend/.env"

echo "==> [5/7] Installation des dépendances et build du frontend"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR/backend' && npm install --omit=dev"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR/frontend' && npm install && npm run build"

echo "==> [6/7] Service systemd (redémarrage automatique en cas de crash)"
cat > /etc/systemd/system/netmaintain.service <<UNIT
[Unit]
Description=NetMaintain API (Node.js)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now netmaintain

echo "==> [7/7] Nginx : reverse proxy + headers de sécurité"
cat > /etc/nginx/sites-available/netmaintain <<'NGINX'
server {
    listen 80;
    server_name __SERVER_NAME__;

    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Les métriques ne sont lues que par Prometheus en local
    location = /metrics {
        deny all;
    }

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sed -i "s/__SERVER_NAME__/${DOMAIN}/" /etc/nginx/sites-available/netmaintain
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/netmaintain /etc/nginx/sites-enabled/netmaintain
nginx -t
systemctl enable nginx
systemctl reload nginx

sleep 3
echo
echo "Terminé. Vérification :"
curl -s http://127.0.0.1:4000/api/health || true
echo
systemctl is-active netmaintain nginx mysql
