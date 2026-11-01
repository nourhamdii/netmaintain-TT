# Configuration DNS : associe un nom de domaine à l'IP publique (optionnel)
# Créé uniquement si domain_name ET route53_zone_id sont renseignés dans terraform.tfvars.

resource "aws_route53_record" "app" {
  count   = var.domain_name != "" && var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.vm.public_ip]
}
