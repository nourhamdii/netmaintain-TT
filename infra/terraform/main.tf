# Configuration principale : provider AWS, VM Ubuntu, IP publique fixe
# (équivalent du main.tf AzureRM du rapport, chapitre 5.3)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project_name
    }
  }
}

# Dernière image Ubuntu 24.04 LTS officielle (Canonical)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Clé SSH (clé publique uniquement)
resource "aws_key_pair" "this" {
  key_name   = "${var.project_name}-key"
  public_key = file(pathexpand(var.public_key_path))
}

# La machine virtuelle (Nginx + Node.js + MySQL + Jenkins + monitoring)
resource "aws_instance" "vm" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.this.key_name
  vpc_security_group_ids = [aws_security_group.vm.id]
  # AWS Academy : on réutilise le profil existant (la création de rôles IAM est interdite)
  iam_instance_profile = var.instance_profile_name

  root_block_device {
    volume_size = var.disk_size_gb
    volume_type = "gp3"
    # encrypted = true  # désactivé : le chiffrement KMS peut être bloqué dans AWS Academy
  }

  metadata_options {
    http_tokens = "required" # IMDSv2 uniquement
  }

  tags = {
    Name = "${var.project_name}-vm"
  }
}

# IP publique fixe (reste la même après un arrêt/redémarrage)
resource "aws_eip" "vm" {
  domain   = "vpc"
  instance = aws_instance.vm.id

  tags = {
    Name = "${var.project_name}-ip"
  }
}
