#!/usr/bin/env bash
# 5.4 - Jenkins (OpenJDK 21) pour le pipeline CI/CD
# Usage : sudo bash 02-install-jenkins.sh

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y fontconfig openjdk-21-jre-headless curl

install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key -o /etc/apt/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  > /etc/apt/sources.list.d/jenkins.list

apt-get update -y
apt-get install -y jenkins
systemctl enable --now jenkins

# Jenkins devient propriétaire du code déployé pour pouvoir faire "git reset" et "npm install"
chown -R jenkins:jenkins /opt/netmaintain
# Le fichier .env reste lisible par le service Node.js (utilisateur ubuntu)
chown jenkins:ubuntu /opt/netmaintain/backend/.env
chmod 640 /opt/netmaintain/backend/.env

# Jenkins n'a le droit de sudo QUE pour redémarrer / vérifier le service
cat > /etc/sudoers.d/jenkins-netmaintain <<'SUDO'
jenkins ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart netmaintain, /usr/bin/systemctl is-active netmaintain
SUDO
chmod 440 /etc/sudoers.d/jenkins-netmaintain
visudo -cf /etc/sudoers.d/jenkins-netmaintain

echo
echo "Jenkins installé. Mot de passe initial :"
for i in $(seq 1 30); do
  [ -f /var/lib/jenkins/secrets/initialAdminPassword ] && break
  sleep 2
done
cat /var/lib/jenkins/secrets/initialAdminPassword
echo
echo "Ouvrez http://IP_PUBLIQUE:8080"
