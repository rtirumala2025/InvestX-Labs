# Deployment Guide

This guide covers deploying the AI Investment Backend system in various environments.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Load Balancer │    │   API Gateway   │
│   (React App)   │◄──►│   (Nginx)       │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 │                                 │
                       ▼                                 ▼                                 ▼
              ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
              │   Firebase      │              │   Redis Cache   │              │   ChromaDB      │
              │   Firestore     │              │                 │              │   Vector Store  │
              └─────────────────┘              └─────────────────┘              └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Data Pipeline │
              │   (Scheduler)   │
              └─────────────────┘
```

## 🐳 Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- SSL certificates (for production)

### 1. Environment Setup

Create production environment file:
```bash
cp env.example .env.prod
```

Configure production settings:
```env
# Production Configuration
API_DEBUG=False
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000

# Security
SECRET_KEY=your_very_secure_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# Database
REDIS_URL=redis://redis:6379
CHROMA_PERSIST_DIRECTORY=/app/chroma_db

# External Services
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
# ... other Firebase credentials
```

### 2. SSL Certificates

For production, you need SSL certificates:

```bash
# Create SSL directory
mkdir -p ssl

# Option 1: Self-signed certificates (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem

# Option 2: Let's Encrypt certificates (for production)
# Use certbot or similar tool to obtain real certificates
```

### 3. Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  ai-investment-backend:
    build: .
    container_name: ai-investment-backend-prod
    ports:
      - "8000:8000"
    environment:
      - API_DEBUG=false
      - LOG_LEVEL=INFO
    env_file:
      - .env.prod
    volumes:
      - ./chroma_db:/app/chroma_db
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: ai-investment-redis-prod
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    container_name: ai-investment-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ai-investment-backend
    restart: unless-stopped

volumes:
  redis_data:
    driver: local
```

### 4. Deploy with Docker Compose

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. ECS with Fargate

Create `aws-deployment.yml`:
```yaml
# ECS Task Definition
api:
  family: ai-investment-backend
  networkMode: awsvpc
  requiresCompatibilities:
    - FARGATE
  cpu: 512
  memory: 1024
  executionRoleArn: arn:aws:iam::account:role/ecsTaskExecutionRole
  taskRoleArn: arn:aws:iam::account:role/ecsTaskRole
  containerDefinitions:
    - name: ai-investment-backend
      image: your-account.dkr.ecr.region.amazonaws.com/ai-investment-backend:latest
      portMappings:
        - containerPort: 8000
          protocol: tcp
      environment:
        - name: API_DEBUG
          value: "false"
        - name: LOG_LEVEL
          value: "INFO"
      secrets:
        - name: OPENAI_API_KEY
          valueFrom: arn:aws:secretsmanager:region:account:secret:openai-api-key
        - name: FIREBASE_PROJECT_ID
          valueFrom: arn:aws:secretsmanager:region:account:secret:firebase-project-id
      logConfiguration:
        logDriver: awslogs
        options:
          awslogs-group: /ecs/ai-investment-backend
          awslogs-region: us-east-1
          awslogs-stream-prefix: ecs
```

#### 2. RDS for Redis Alternative

Use AWS ElastiCache for Redis:
```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id ai-investment-redis \
    --cache-node-type cache.t3.micro \
    --engine redis \
    --num-cache-nodes 1
```

#### 3. Application Load Balancer

```yaml
# ALB Configuration
load_balancer:
  name: ai-investment-alb
  scheme: internet-facing
  type: application
  subnets:
    - subnet-12345678
    - subnet-87654321
  security_groups:
    - sg-12345678
  listeners:
    - port: 80
      protocol: HTTP
      default_actions:
        - type: redirect
          redirect_config:
            protocol: HTTPS
            port: 443
            status_code: HTTP_301
    - port: 443
      protocol: HTTPS
      ssl_policy: ELBSecurityPolicy-TLS-1-2-2017-01
      certificates:
        - arn:aws:acm:region:account:certificate/certificate-id
      default_actions:
        - type: forward
          target_group_arn: arn:aws:elasticloadbalancing:region:account:targetgroup/ai-investment-tg
```

### Google Cloud Platform

#### 1. Cloud Run Deployment

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ai-investment-backend
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      containers:
      - image: gcr.io/PROJECT_ID/ai-investment-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: API_DEBUG
          value: "false"
        - name: LOG_LEVEL
          value: "INFO"
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
          requests:
            cpu: "1"
            memory: "1Gi"
```

#### 2. Deploy to Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-investment-backend

# Deploy to Cloud Run
gcloud run deploy ai-investment-backend \
    --image gcr.io/PROJECT_ID/ai-investment-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --max-instances 10
```

### Azure Deployment

#### 1. Container Instances

```yaml
# azure-container-instance.yaml
apiVersion: 2018-10-01
location: eastus
name: ai-investment-backend
properties:
  containers:
  - name: ai-investment-backend
    properties:
      image: your-registry.azurecr.io/ai-investment-backend:latest
      resources:
        requests:
          cpu: 1
          memoryInGb: 2
      ports:
      - port: 8000
        protocol: TCP
      environmentVariables:
      - name: API_DEBUG
        value: "false"
      - name: LOG_LEVEL
        value: "INFO"
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 8000
  restartPolicy: Always
```

## 🔧 Configuration Management

### Environment Variables

#### Development
```env
API_DEBUG=True
LOG_LEVEL=DEBUG
REDIS_URL=redis://localhost:6379
```

#### Staging
```env
API_DEBUG=False
LOG_LEVEL=INFO
REDIS_URL=redis://staging-redis:6379
```

#### Production
```env
API_DEBUG=False
LOG_LEVEL=WARNING
REDIS_URL=redis://prod-redis:6379
```

### Secrets Management

#### AWS Secrets Manager
```bash
# Store secrets
aws secretsmanager create-secret \
    --name "ai-investment/openai-api-key" \
    --description "OpenAI API Key" \
    --secret-string "your-openai-api-key"

aws secretsmanager create-secret \
    --name "ai-investment/firebase-credentials" \
    --description "Firebase Service Account" \
    --secret-string '{"type":"service_account","project_id":"..."}'
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-investment-secrets
type: Opaque
data:
  openai-api-key: <base64-encoded-key>
  firebase-credentials: <base64-encoded-json>
```

## 📊 Monitoring & Observability

### Health Checks

#### Application Health
```python
# Custom health check endpoint
@app.get("/health/detailed")
async def detailed_health_check():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": await check_database_health(),
            "cache": await check_cache_health(),
            "ai_services": await check_ai_services_health(),
            "external_apis": await check_external_apis_health()
        }
    }
    return health_status
```

#### Load Balancer Health Checks
```yaml
# ALB Target Group Health Check
health_check:
  enabled: true
  healthy_threshold: 2
  interval: 30
  matcher: "200"
  path: "/health"
  port: "traffic-port"
  protocol: HTTP
  timeout: 5
  unhealthy_threshold: 2
```

### Logging

#### Structured Logging
```python
import structlog

logger = structlog.get_logger()

# Structured log entry
logger.info(
    "User interaction",
    user_id="user123",
    action="chat_message",
    message_length=50,
    response_time=1.2
)
```

#### Log Aggregation
- **AWS**: CloudWatch Logs
- **GCP**: Cloud Logging
- **Azure**: Application Insights
- **Self-hosted**: ELK Stack (Elasticsearch, Logstash, Kibana)

### Metrics

#### Application Metrics
```python
from prometheus_client import Counter, Histogram, Gauge

# Define metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')

# Use in middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path).inc()
    REQUEST_DURATION.observe(duration)
    
    return response
```

#### Infrastructure Metrics
- **CPU Usage**: Monitor container CPU utilization
- **Memory Usage**: Track memory consumption
- **Network I/O**: Monitor network traffic
- **Disk I/O**: Track storage usage

## 🔒 Security

### SSL/TLS Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

### Network Security

#### Firewall Rules
```bash
# UFW (Ubuntu)
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 8000/tcp   # Block direct API access
ufw enable
```

#### Security Groups (AWS)
```yaml
# Security Group Rules
security_groups:
  - name: ai-investment-alb-sg
    rules:
      - type: ingress
        from_port: 80
        to_port: 80
        protocol: tcp
        cidr_blocks: ["0.0.0.0/0"]
      - type: ingress
        from_port: 443
        to_port: 443
        protocol: tcp
        cidr_blocks: ["0.0.0.0/0"]
  - name: ai-investment-app-sg
    rules:
      - type: ingress
        from_port: 8000
        to_port: 8000
        protocol: tcp
        source_security_group_id: ai-investment-alb-sg
```

### Authentication & Authorization

#### API Key Authentication
```python
from fastapi import HTTPException, Depends, Header

async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.get("/api/protected")
async def protected_endpoint(api_key: str = Depends(verify_api_key)):
    return {"message": "Access granted"}
```

#### JWT Authentication
```python
import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## 🚀 Scaling

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
upstream ai_investment_backend {
    least_conn;
    server backend1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend2:8000 weight=1 max_fails=3 fail_timeout=30s;
    server backend3:8000 weight=1 max_fails=3 fail_timeout=30s;
}
```

#### Auto Scaling (AWS ECS)
```yaml
# Auto Scaling Configuration
auto_scaling:
  min_capacity: 2
  max_capacity: 10
  target_cpu_utilization: 70
  target_memory_utilization: 80
  scale_out_cooldown: 300
  scale_in_cooldown: 300
```

### Database Scaling

#### Redis Cluster
```yaml
# Redis Cluster Configuration
redis_cluster:
  nodes:
    - redis-node-1:6379
    - redis-node-2:6379
    - redis-node-3:6379
  replicas: 1
  max_redirects: 3
```

#### Firestore Scaling
- Use Firestore's automatic scaling
- Implement proper indexing
- Use batch operations for bulk writes
- Implement connection pooling

### Caching Strategy

#### Multi-Level Caching
```python
# L1: In-memory cache
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_content(content_id: str):
    return fetch_content_from_database(content_id)

# L2: Redis cache
async def get_redis_cached_data(key: str):
    cached = await redis_client.get(key)
    if cached:
        return json.loads(cached)
    return None

# L3: Database
async def get_database_data(query: str):
    return await database.execute(query)
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest
      - name: Run tests
        run: pytest

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t ai-investment-backend .
      - name: Push to registry
        run: |
          docker tag ai-investment-backend ${{ secrets.REGISTRY_URL }}/ai-investment-backend:latest
          docker push ${{ secrets.REGISTRY_URL }}/ai-investment-backend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy using your preferred method
          # AWS ECS, Google Cloud Run, Azure Container Instances, etc.
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pip install pytest
    - pytest

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
    # Add deployment commands
```

## 📋 Maintenance

### Backup Strategy

#### Database Backups
```bash
# Firestore backup
gcloud firestore export gs://your-backup-bucket/firestore-backup-$(date +%Y%m%d)

# Redis backup
redis-cli --rdb /backup/redis-backup-$(date +%Y%m%d).rdb

# ChromaDB backup
cp -r chroma_db /backup/chromadb-backup-$(date +%Y%m%d)
```

#### Automated Backups
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

mkdir -p $BACKUP_DIR

# Backup Redis
redis-cli --rdb $BACKUP_DIR/redis.rdb

# Backup ChromaDB
cp -r chroma_db $BACKUP_DIR/

# Upload to cloud storage
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/$DATE/

# Cleanup old backups (keep 30 days)
find /backups -type d -mtime +30 -exec rm -rf {} \;
```

### Updates & Patches

#### Rolling Updates
```bash
# Update with zero downtime
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps ai-investment-backend
```

#### Blue-Green Deployment
```bash
# Deploy to green environment
docker-compose -f docker-compose.green.yml up -d

# Test green environment
curl -f http://green.your-domain.com/health

# Switch traffic to green
# Update load balancer configuration

# Shutdown blue environment
docker-compose -f docker-compose.blue.yml down
```

### Monitoring & Alerting

#### Health Check Monitoring
```python
# Custom health check with detailed status
@app.get("/health/detailed")
async def detailed_health():
    checks = {
        "database": await check_firestore_connection(),
        "cache": await check_redis_connection(),
        "vector_store": await check_chromadb_connection(),
        "ai_services": await check_openai_connection(),
        "data_pipeline": await check_scheduler_status()
    }
    
    overall_status = "healthy" if all(checks.values()) else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }
```

#### Alerting Rules
```yaml
# Prometheus alerting rules
groups:
  - name: ai-investment-backend
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
```

This deployment guide provides comprehensive instructions for deploying the AI Investment Backend system in various environments with proper security, monitoring, and scaling considerations.
