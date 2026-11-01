// Pipeline CI/CD NetMaintain-Deploy (7 étapes, comme le tableau 5.2 du rapport)
// À placer à la racine du dépôt GitHub.

pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timestamps()
  }

  // Webhook GitHub si joignable, sinon vérification du dépôt toutes les ~2 minutes
  triggers {
    githubPush()
    pollSCM('H/2 * * * *')
  }

  environment {
    APP_DIR = '/opt/netmaintain'
  }

  stages {
    stage('1. Pull Latest Code') {
      steps {
        sh 'cd "$APP_DIR" && git fetch origin && git reset --hard origin/main'
      }
    }

    stage('2. Install Dependencies') {
      steps {
        sh 'cd "$APP_DIR/backend" && npm install --omit=dev'
        sh 'cd "$APP_DIR/frontend" && npm install'
      }
    }

    stage('3. Node Syntax Check') {
      steps {
        sh 'cd "$APP_DIR/backend" && node --check server.js && node --check db.js'
      }
    }

    stage('4. Build Frontend') {
      steps {
        sh 'cd "$APP_DIR/frontend" && npm run build'
      }
    }

    stage('5. Init Database') {
      steps {
        sh '''
          cd "$APP_DIR/backend"
          node -e "require('./db').init().then(() => { console.log('Base de donnees OK'); process.exit(0); }).catch((e) => { console.error(e.message); process.exit(1); })"
        '''
      }
    }

    stage('6. Restart Service') {
      steps {
        sh 'sudo systemctl restart netmaintain'
      }
    }

    stage('7. Verify Deployment') {
      steps {
        sh '''
          for i in $(seq 1 15); do
            api=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/api/health || true)
            web=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ || true)
            echo "API=$api  Nginx=$web"
            if [ "$api" = "200" ] && { [ "$web" = "200" ] || [ "$web" = "301" ] || [ "$web" = "302" ]; }; then
              echo "Deploiement verifie"
              exit 0
            fi
            sleep 2
          done
          echo "Echec de la verification"
          exit 1
        '''
      }
    }
  }

  post {
    success { echo 'NetMaintain deploye avec succes.' }
    failure { echo 'Echec du deploiement : consultez la console de ce build.' }
  }
}
