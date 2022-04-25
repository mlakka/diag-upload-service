Diag Upload Service
===================================

This is a Node.js based application that accepts and serves .tgz Diag files through HTTP protocol

  Core service components:
  ======================================

  1. Github Actions for CI/CD
  2. Docker-compose for service provisioning and networking, also to run locally
  3. Lightsail container service platform to run on AWS
  
  Architectureal Considerations
  ===================================================
  1. The container deployment platform chosen for this application is Amazon Lightsail
  2. Lightsail simplifies multi container deployment with networking (VPC Peering), and is also configurable with a block storage for persistence
  3. Lightsail includes Route53 and public Ipv4 configurations so custom domain requirements can also be addressed if needed	
  4. Prometheus loki and grafana configs can be reused if we need to migrate this service to kubernetes or fargate in the future (TODO: Add promtail for parsing container stdout and stderr)
  5. Lightsail does not require a ECR source, and can work with local containers, making it ideal for hybrid cloud applications
  6. For this application I believe Lightsail offers the perfect tradeoff between customizability and ease of use, compared to Fargate, AppRunner or EKS, which require a bit more overhead to  deploy and maintain
  7. Lightsail billing is fixed, though it is burstable, making is ideal for sudden increase in request processing requirements, while keeping the cost predictable
  8. App runner is another viable candidate, but is not as mature, and does not support multi-container configurations as of now

  Prerequisites
  ===================================================
  1. Create an IAM user with the right permissions for Lightsail
  2. Obtain and store the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for this user in Github Actions secrets to be used by the CICD process

  Install and run application locally
  ===================================================
  1. Run the following command to provision the service, along with Prometheus (port 9090), Loki (port 3100) and Grafana (port 3000) on localhost
  ```
  docker-compose up -d
  ```
  2. On a browser on the host machine, go to
  ```
     localhost:3000
  ```
  3. Grafana is preconfigured with Loki and Prometheus datasources, which should automatically start pushing metrics and logs
  4. The service is listening on port 8000, test with the following command (replace filename with the path of the .tgz diag file)
  ```
     curl --location --request POST 'localhost:8000/upload' \
       --header 'Content-Type: multipart/form-data' \
       --form 'diag=@<filename>'
    Reseponse:
      File Desktop.tgz uploaded
  ```
  5. The /upload service only accepts .tgz files, if a different format file is uploaded, you will get the following error
  ```
     diag files can only be .tgz files
  ```

  CI/CD workflow.
  ======================================
  
  The repository leverages Github Actions as CI/CD tool.
  The workflow is as follows:
  1. Check out the repo
  2. Configure AWS credentials (pull from Github Actions Secrets)
  3. Docker-compose to provision images and containers on the CICD server
  4. aws lightsail cli to push the container images and create a Container Service deployment to Lightsail Container Service
  
  Observability
  ======================================

    1. The docker-compose multi-container deployment is configured to automatically produce Prometheus Metrics (on /metrics endpoint) and Logs in Loki (using winston-loki)
    2. Grafana is configured to be the central point of observability, and when run locally is available on localhost:3000
  
  Diag service Enhancements:
  ======================================
    1. Added conditions to only accept .tgz files
    2. Integrated with 'express-prom-bundle' middleware to push common metrics directly to prometheus, with minimal configuration
    3. Integrated with 'winston' logging framework using 'winston-loki' for automatic log exports to loki datasource, so they are readily available in Grafana
    4. Modified Dockerfile to adhere to Node.js best practices (run as non-root etc.)

  Assumptions
  ===================================================
    1. We want the service to be always listening (hence Lightsail, otherwise Lambda or Fargate serverless might be better suited)
    2. A single-region deployment is sufficient for the initial deployment
    3. The volume of diag files to be stored is less than 20TB a month (soft limit)
    4. Once diag files are uploaded, they are not necessarily moved to other storage locations like S3 (There are soft limits)

  TODO:
  =======================================
    1. Unit Tests (using Jest or Mocha)
    2. Nginx Load balancing in Lightsail
    3. Configure additional dashboards in grafana, currently we went with out-of-the-box dashboards
    4. Migrate application to EKS with Nginx Ingress or Fargate for more control over Networking, Scaling and Availability
    5. Add concurrency to the diag service to handle multiple requests simultaneously
    6. OAuth2/OpenID integration
    7. Add Prometheus Service Discovery for Lightsail metrics
    8. Integrate with Jaeger for exporting traces to grafana
    9. Add promtail to the Observability stack for parsing and labelling standard and custom logs