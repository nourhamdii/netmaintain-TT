output "public_ip" {
  description = "IP publique de la VM"
  value       = aws_eip.vm.public_ip
}

output "ssh_command" {
  description = "Commande de connexion SSH"
  value       = "ssh -i ~/.ssh/netmaintain_key ubuntu@${aws_eip.vm.public_ip}"
}

output "app_url" {
  value = "http://${aws_eip.vm.public_ip}"
}

output "jenkins_url" {
  value = "http://${aws_eip.vm.public_ip}:8080"
}

output "grafana_url" {
  value = "http://${aws_eip.vm.public_ip}:3000"
}

output "prometheus_url" {
  value = "http://${aws_eip.vm.public_ip}:9090"
}

output "storage_bucket" {
  description = "Nom du bucket S3 (à utiliser dans le script de sauvegarde)"
  value       = aws_s3_bucket.storage.bucket
}

output "aws_region" {
  value = var.aws_region
}
