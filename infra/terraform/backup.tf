# AWS Backup (équivalent d'Azure Backup / coffre epiconnect-backup-vault du rapport, 5.6)
# Sauvegarde quotidienne de la VM, conservée 14 jours.
# DÉSACTIVÉ par défaut dans AWS Academy (service parfois refusé).
# Pour l'activer : enable_aws_backup = true dans terraform.tfvars
# Utilise le rôle existant LabRole (aucun rôle IAM créé).

resource "aws_backup_vault" "this" {
  count = var.enable_aws_backup ? 1 : 0
  name  = "${var.project_name}-backup-vault"
}

resource "aws_backup_plan" "daily" {
  count = var.enable_aws_backup ? 1 : 0
  name  = "${var.project_name}-daily"

  rule {
    rule_name         = "daily-2am-utc"
    target_vault_name = aws_backup_vault.this[0].name
    schedule          = "cron(0 2 * * ? *)"

    lifecycle {
      delete_after = var.backup_retention_days
    }
  }
}

resource "aws_backup_selection" "vm" {
  count        = var.enable_aws_backup ? 1 : 0
  name         = "${var.project_name}-vm"
  iam_role_arn = "arn:aws:iam::${data.aws_caller_identity.me.account_id}:role/LabRole"
  plan_id      = aws_backup_plan.daily[0].id
  resources    = [aws_instance.vm.arn]
}
