# NetMaintain sur AWS (transposition du chapitre 5 du rapport)

À copier dans la racine de votre dépôt GitHub (à côté de `backend/` et `frontend/`) :

    Jenkinsfile
    deploy/scripts/01-setup-server.sh ... 04-setup-backup.sh
    infra/terraform/*.tf

Ordre d'exécution :
1. `infra/terraform`  : terraform init / plan / apply        (5.3)
2. `01-setup-server.sh` sur la VM                            (5.2)
3. `02-install-jenkins.sh` + création du job Jenkins         (5.4)
4. `03-install-monitoring.sh`                                (5.5)
5. Certbot (HTTPS) + `04-setup-backup.sh`                    (5.6)

Ne poussez jamais sur GitHub : `terraform.tfvars`, `*.tfstate`, `backend/.env`, clés SSH, clés AWS.

## Version AWS Academy (Learner Lab)
- Région : us-east-1 (us-west-2 aussi autorisée).
- Aucun rôle IAM créé : la VM utilise le profil existant `LabInstanceProfile`.
- AWS Backup désactivé par défaut (`enable_aws_backup = false`).
- Les clés de la section « AWS Details » expirent à la fin de chaque session : à recopier dans ~/.aws/credentials.
