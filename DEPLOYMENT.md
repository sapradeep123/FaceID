# 🚀 FaceID Deployment Guide

This guide provides comprehensive instructions for deploying the FaceID application to various environments with full configurability and CI/CD support.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows
- **Docker**: Version 20.10+ with Docker Compose
- **Node.js**: Version 18+ (for local development)
- **Python**: Version 3.11+ (for local development)
- **PostgreSQL**: Version 13+ with pgvector extension

### Required Software
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Node.js (for local development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python (for local development)
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-pip python3.11-venv
```

## ⚙️ Environment Configuration

### 1. Copy Environment Template
```bash
# Copy the environment template
cp env.example .env

# Edit the configuration
nano .env
```

### 2. Configure Environment Variables

#### Backend Configuration (`.env`)
```bash
# Application Settings
APP_NAME=FaceID
APP_VERSION=1.0.0
ENV=production
DEBUG=false

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=faceid
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=faceid

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE_MINUTES=1440
INTERNAL_API_KEY=your-internal-api-key-change-this

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com

# Face Engine Configuration
FACE_ENGINE_URL=http://127.0.0.1:9000

# Performance Configuration
WEB_CONCURRENCY=4
```

#### Frontend Configuration (`frontend/.env`)
```bash
# API Configuration
REACT_APP_API_BASE_URL=https://yourdomain.com/api

# Application Configuration
REACT_APP_NAME=FaceID
REACT_APP_VERSION=1.0.0

# Development Configuration
REACT_APP_DEV_MODE=false
```

## 🏠 Local Development

### 1. Start Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Development Commands
```bash
# Backend development
cd app
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend
npm start

# Database management
python scripts/init_db.py
python scripts/db_check.py
```

## 🌐 Production Deployment

### 1. Using Deployment Scripts

#### Linux/macOS
```bash
# Basic deployment
./scripts/deploy.sh --environment production

# With custom domain and SSL
./scripts/deploy.sh \
  --environment production \
  --domain faceid.example.com \
  --ssl-email admin@example.com
```

#### Windows
```cmd
REM Basic deployment
scripts\deploy.bat --environment production

REM With custom domain and SSL
scripts\deploy.bat --environment production --domain faceid.example.com --ssl-email admin@example.com
```

### 2. Manual Docker Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Cloud Deployment

#### AWS EC2
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Clone repository
git clone https://github.com/yourusername/faceid.git
cd faceid

# Configure environment
cp env.example .env
nano .env

# Deploy
./scripts/deploy.sh --environment production --domain your-domain.com
```

#### DigitalOcean Droplet
```bash
# Create droplet with Docker pre-installed
# Follow AWS EC2 instructions above
```

#### Google Cloud Platform
```bash
# Create VM instance
gcloud compute instances create faceid-app \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a

# SSH into instance and follow AWS EC2 instructions
```

## 🐳 Docker Deployment

### 1. Production Docker Compose
```yaml
version: "3.8"

services:
  db:
    image: ankane/pgvector:latest
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - API_HOST=${API_HOST}
      - API_PORT=${API_PORT}
      - JWT_SECRET=${JWT_SECRET}
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
      - CORS_ORIGINS=${CORS_ORIGINS}
    ports:
      - "${API_PORT}:8000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - api

volumes:
  pgdata:
```

### 2. Docker Build Commands
```bash
# Build API image
docker build -t faceid-api:latest .

# Build Frontend image
docker build -t faceid-frontend:latest ./frontend

# Run with Docker Compose
docker-compose up -d
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow
The application includes a complete CI/CD pipeline in `.github/workflows/deploy.yml`:

- **Automated Testing**: Runs tests on every push and pull request
- **Docker Build**: Builds and pushes Docker images to GitHub Container Registry
- **Deployment**: Deploys to production on main branch pushes

### 2. Pipeline Features
- ✅ **Multi-environment support** (development, staging, production)
- ✅ **Automated testing** with PostgreSQL service
- ✅ **Docker image building** and registry push
- ✅ **Security scanning** and vulnerability checks
- ✅ **Rollback capabilities** with image tagging

### 3. Customizing the Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy FaceID Application

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    # ... test configuration

  build:
    needs: test
    runs-on: ubuntu-latest
    # ... build configuration

  deploy:
    needs: build
    runs-on: ubuntu-latest
    # ... deployment configuration
```

## 📚 Environment Variables Reference

### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | `FaceID` | No |
| `APP_VERSION` | Application version | `1.0.0` | No |
| `ENV` | Environment (production/staging/development) | `production` | No |
| `DEBUG` | Enable debug mode | `false` | No |
| `API_HOST` | API server host | `0.0.0.0` | No |
| `API_PORT` | API server port | `8000` | No |
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `5432` | Yes |
| `POSTGRES_USER` | Database username | `postgres` | Yes |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `POSTGRES_DB` | Database name | `faceid` | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `INTERNAL_API_KEY` | Internal API key | - | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` | No |
| `FACE_ENGINE_URL` | Face engine service URL | `http://127.0.0.1:9000` | No |
| `WEB_CONCURRENCY` | Number of worker processes | `4` | No |

### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_BASE_URL` | Backend API URL | `http://localhost:8000` | Yes |
| `REACT_APP_NAME` | Application name | `FaceID` | No |
| `REACT_APP_VERSION` | Application version | `1.0.0` | No |
| `REACT_APP_DEV_MODE` | Development mode | `false` | No |

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose logs db

# Test database connection
python scripts/db_check.py

# Reset database
docker-compose down -v
docker-compose up -d
```

#### 2. Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000

# Change ports in .env
API_PORT=8001
FRONTEND_PORT=3001
```

#### 3. CORS Issues
```bash
# Update CORS origins in .env
CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com

# Restart services
docker-compose restart api
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
curl -I https://yourdomain.com
```

### Logs and Debugging

#### View Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100
```

#### Debug Mode
```bash
# Enable debug mode
echo "DEBUG=true" >> .env

# Restart services
docker-compose restart
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_face_embeddings_user_id ON face_embeddings(user_id);
CREATE INDEX idx_face_embeddings_branch_id ON face_embeddings(branch_id);
CREATE INDEX idx_users_org_id ON users(org_id);
```

#### 2. Application Optimization
```bash
# Increase worker processes
WEB_CONCURRENCY=8

# Enable gzip compression
# (Already configured in nginx.conf)

# Set up Redis for caching (optional)
# Add Redis service to docker-compose.yml
```

## 📞 Support

For deployment issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify environment variables**: Ensure all required variables are set
3. **Test database connection**: `python scripts/db_check.py`
4. **Check port availability**: Ensure ports 8000 and 3000 are free
5. **Review firewall settings**: Ensure ports are accessible

## 🔐 Security Considerations

### Production Security Checklist

- [ ] Change default passwords and secrets
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Enable monitoring and logging
- [ ] Keep dependencies updated
- [ ] Use environment-specific configurations
- [ ] Implement rate limiting
- [ ] Set up intrusion detection

### Security Best Practices

1. **Use strong passwords** for database and JWT secrets
2. **Enable HTTPS** in production
3. **Regular backups** of database and configuration
4. **Monitor logs** for suspicious activity
5. **Keep software updated** regularly
6. **Use environment variables** for sensitive data
7. **Implement proper CORS** configuration
8. **Set up monitoring** and alerting

---

## 🎉 Congratulations!

You have successfully deployed the FaceID application! The system is now fully configurable and ready for production use with:

- ✅ **Environment-based configuration**
- ✅ **Docker containerization**
- ✅ **CI/CD pipeline**
- ✅ **SSL/HTTPS support**
- ✅ **Database backup and recovery**
- ✅ **Monitoring and logging**
- ✅ **Security best practices**

For additional support or questions, please refer to the troubleshooting section or create an issue in the repository.
