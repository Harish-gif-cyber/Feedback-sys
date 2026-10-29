pipeline {
    agent any

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Source code checked out successfully.'
            }
        }

        stage('Check Node.js') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Validate Application') {
            steps {
                bat 'npm run check'
            }
        }

        stage('Verify Version') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'v1') {
                        echo 'Building Feedback System v1'
                    } else if (env.BRANCH_NAME == 'v2') {
                        echo 'Building Feedback System v2'
                    } else if (env.BRANCH_NAME == 'v3') {
                        echo 'Building Feedback System v3'
                    } else {
                        echo "Building branch: ${env.BRANCH_NAME}"
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Feedback System pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}