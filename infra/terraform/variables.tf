# Variables : IP admin, région, noms des ressources

variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "us-east-1" # AWS Academy : us-east-1 ou us-west-2 uniquement
}

variable "project_name" {
  description = "Préfixe des noms de ressources"
  type        = string
  default     = "netmaintain"
}

variable "instance_type" {
  description = "Type d'instance (t3.medium = 4 Go de RAM, recommandé pour Jenkins + Grafana + MySQL)"
  type        = string
  default     = "t3.medium"
}

variable "disk_size_gb" {
  description = "Taille du disque en Go"
  type        = number
  default     = 30
}

variable "admin_ip" {
  description = "Votre IP publique au format x.x.x.x/32 (accès SSH, Jenkins, Grafana, Prometheus)"
  type        = string
}

variable "public_key_path" {
  description = "Chemin de votre clé SSH publique"
  type        = string
  default     = "~/.ssh/netmaintain_key.pub"
}

variable "domain_name" {
  description = "Nom de domaine (optionnel, nécessaire pour HTTPS Let's Encrypt)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "ID de la zone Route 53 du domaine (optionnel)"
  type        = string
  default     = ""
}

variable "instance_profile_name" {
  description = "Profil IAM existant à attacher à la VM (AWS Academy : LabInstanceProfile)"
  type        = string
  default     = "LabInstanceProfile"
}

variable "enable_aws_backup" {
  description = "Active AWS Backup (peut être refusé dans AWS Academy ; laissez false si erreur)"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Durée de rétention des sauvegardes en jours"
  type        = number
  default     = 14
}
