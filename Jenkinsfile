pipeline {
    agent { label 'docker-agent' }

    options {
        ansiColor('xterm')
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Install') {
            steps {
                sh 'YARN_ENABLE_SCRIPTS=0 yarn install --immutable'
            }
        }

        stage('Type Check') {
            steps {
                sh 'yarn check'
            }
        }

        stage('Test') {
            steps {
                sh 'yarn test'
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    file(credentialsId: 'vertin-hitcon-env', variable: 'ENV_FILE'),
                ]) {
                    sh 'cp "$ENV_FILE" .env'
                    sh 'docker compose build'
                    sh 'docker compose down || true'
                    sh 'docker compose up -d'
                }
            }
        }

        stage('Health Check') {
            steps {
                retry(3) {
                    sleep 5
                    sh 'docker inspect --format="{{.State.Running}}" vertin-hitcon-bot | grep true'
                }
            }
        }
    }

    post {
        failure {
            sh 'docker compose logs --tail=50 || true'
        }
        success {
            sh 'docker image prune -f || true'
        }
    }
}
