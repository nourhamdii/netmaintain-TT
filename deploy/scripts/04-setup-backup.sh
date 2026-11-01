#!/usr/bin/env bash
# 5.6 - Sauvegarde quotidienne de la base MySQL vers S3 (préfixe db-backups/)
# Le bucket est créé par Terraform (output "storage_bucket"). La VM y accède via son rôle IAM.
#
# Usage : sudo bash 04-setup-backup.sh NOM_DU_BUCKET REGION
#   ex  : sudo bash 04-setup-backup.sh netmaintain-storage-036136800740 us-east-1

set -euo pipefail

BUCKET="${1:?Indiquez le nom du bucket S3 (terraform output storage_bucket)}"
REGION="${2:?Indiquez la région AWS (ex: us-east-1)}"

if ! command -v aws >/dev/null 2>&1 && [ ! -x /snap/bin/aws ]; then
  snap install aws-cli --classic
fi

cat > /usr/local/bin/netmaintain-backup.sh <<SCRIPT
#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin:/snap/bin
export AWS_DEFAULT_REGION=${REGION}
FILE="/tmp/netmaintain-\$(date +%F-%H%M).sql.gz"
mysqldump --single-transaction --routines netmaintain | gzip > "\$FILE"
aws s3 cp "\$FILE" "s3://${BUCKET}/db-backups/\$(basename "\$FILE")" --only-show-errors
rm -f "\$FILE"
echo "\$(date -Is) sauvegarde OK"
SCRIPT
chmod 755 /usr/local/bin/netmaintain-backup.sh

# Tous les jours à 02:30
cat > /etc/cron.d/netmaintain-backup <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
30 2 * * * root /usr/local/bin/netmaintain-backup.sh >> /var/log/netmaintain-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/netmaintain-backup

echo "Test immédiat de la sauvegarde..."
/usr/local/bin/netmaintain-backup.sh
echo "Contenu de s3://${BUCKET}/db-backups/ :"
PATH=$PATH:/snap/bin AWS_DEFAULT_REGION="$REGION" aws s3 ls "s3://${BUCKET}/db-backups/"
