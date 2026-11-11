pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'YOUR_DOCKERHUB_USERNAME'
    IMAGE_NAME     = 'devops-demo-app'
    IMAGE          = "${DOCKERHUB_USER}/${IMAGE_NAME}"
    TAG            = "${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Test') {
      steps {
        // Runs npm test inside the Docker build; a failing test fails the pipeline
        sh 'docker build --target test -t ${IMAGE_NAME}-test:${TAG} .'
      }
    }

    stage('Build Image') {
      steps {
        sh 'docker build --target runtime -t ${IMAGE}:${TAG} -t ${IMAGE}:latest .'
      }
    }

    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub',
                                          usernameVariable: 'DH_USER',
                                          passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker push ${IMAGE}:${TAG}
            docker push ${IMAGE}:latest
            docker logout
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            sed -e "s|__IMAGE__|${IMAGE}:${TAG}|" -e "s|__VERSION__|build-${TAG}|" k8s/deployment.yaml | kubectl apply -f -
            kubectl apply -f k8s/service.yaml
            kubectl rollout status deployment/devops-demo-app --timeout=180s
          '''
        }
      }
    }

    stage('Smoke Test') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            kubectl get pods -l app=devops-demo-app
            kubectl delete pod smoke --ignore-not-found
            kubectl run smoke --rm -i --restart=Never --image=curlimages/curl -- curl -sf http://devops-demo-app/health
          '''
        }
      }
    }
  }

  post {
    success { echo "Deployed ${IMAGE}:${TAG}" }
    failure { echo 'Pipeline failed, check the stage logs above.' }
    always  { sh 'docker image prune -f || true' }
  }
}
