# Stockage S3 (équivalent du compte de stockage Azure du rapport)
# Préfixes : media-files/ et db-backups/
# L'accès depuis la VM passe par le rôle existant du lab (LabInstanceProfile), aucun rôle IAM n'est créé.

data "aws_caller_identity" "me" {}

locals {
  bucket_name = "${var.project_name}-storage-${data.aws_caller_identity.me.account_id}"
}

resource "aws_s3_bucket" "storage" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "storage" {
  bucket                  = aws_s3_bucket.storage.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "storage" {
  bucket = aws_s3_bucket.storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Les sauvegardes de base de données sont conservées 14 jours (variable backup_retention_days)
resource "aws_s3_bucket_lifecycle_configuration" "storage" {
  bucket     = aws_s3_bucket.storage.id
  depends_on = [aws_s3_bucket_versioning.storage]

  rule {
    id     = "db-backups-retention"
    status = "Enabled"

    filter {
      prefix = "db-backups/"
    }

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }
  }
}

resource "aws_s3_object" "media_files" {
  bucket  = aws_s3_bucket.storage.id
  key     = "media-files/"
  content = ""
}

resource "aws_s3_object" "db_backups" {
  bucket  = aws_s3_bucket.storage.id
  key     = "db-backups/"
  content = ""
}
