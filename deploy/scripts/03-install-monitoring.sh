#!/usr/bin/env bash
# 5.5 - Monitoring : Node Exporter 1.8.1 (9100), Prometheus 2.52.0 (9090), Grafana OSS (3000)
# Usage : sudo bash 03-install-monitoring.sh

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

NODE_EXPORTER_VERSION=1.8.1
PROMETHEUS_VERSION=2.52.0
cd /tmp

echo "==> Node Exporter ${NODE_EXPORTER_VERSION}"
curl -fsSLO "https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
tar xzf "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
install -m 0755 "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter" /usr/local/bin/node_exporter
id node_exporter &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin node_exporter

cat > /etc/systemd/system/node_exporter.service <<'UNIT'
[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
User=node_exporter
ExecStart=/usr/local/bin/node_exporter --web.listen-address=127.0.0.1:9100
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

echo "==> Prometheus ${PROMETHEUS_VERSION}"
curl -fsSLO "https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
tar xzf "prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"
PDIR="prometheus-${PROMETHEUS_VERSION}.linux-amd64"
id prometheus &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin prometheus
install -d -o prometheus -g prometheus /etc/prometheus /var/lib/prometheus
install -m 0755 "$PDIR/prometheus" "$PDIR/promtool" /usr/local/bin/
cp -r "$PDIR/consoles" "$PDIR/console_libraries" /etc/prometheus/

cat > /etc/prometheus/prometheus.yml <<'YML'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ['localhost:9090']

  - job_name: node_exporter
    static_configs:
      - targets: ['localhost:9100']

  # Activez ce job après avoir ajouté prom-client au backend (route /metrics)
  # - job_name: netmaintain
  #   metrics_path: /metrics
  #   static_configs:
  #     - targets: ['localhost:4000']
YML
chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

cat > /etc/systemd/system/prometheus.service <<'UNIT'
[Unit]
Description=Prometheus
After=network.target

[Service]
User=prometheus
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus \
  --storage.tsdb.retention.time=15d \
  --web.listen-address=0.0.0.0:9090
Restart=always

[Install]
WantedBy=multi-user.target
UNIT

echo "==> Grafana OSS"
install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://apt.grafana.com/gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/grafana.gpg
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" > /etc/apt/sources.list.d/grafana.list
apt-get update -y
apt-get install -y grafana

systemctl daemon-reload
systemctl enable --now node_exporter prometheus grafana-server

sleep 3
echo
systemctl is-active node_exporter prometheus grafana-server
echo "Prometheus : http://IP_PUBLIQUE:9090   Grafana : http://IP_PUBLIQUE:3000 (admin / admin, à changer)"
