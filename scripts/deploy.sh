#!/bin/bash

# ===========================================
# FaceID Deployment Script
# ===========================================
# This script helps deploy the FaceID application to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
DOMAIN=""
SSL_EMAIL=""
BACKUP_ENABLED=true

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Environment to deploy to (production, staging, development)"
    echo "  -d, --domain DOMAIN      Domain name for the application"
    echo "  -s, --ssl-email EMAIL    Email for SSL certificate registration"
    echo "  -n, --no-backup          Skip database backup"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment production --domain faceid.example.com --ssl-email admin@example.com"
    echo "  $0 -e staging -d staging.faceid.example.com"
    echo "  $0 --environment development"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -s|--ssl-email)
            SSL_EMAIL="$2"
            shift 2
            ;;
        -n|--no-backup)
            BACKUP_ENABLED=false
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: production, staging, development"
    exit 1
fi

print_status "Starting deployment for environment: $ENVIRONMENT"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    print_error ".env file not found!"
    print_status "Please copy env.example to .env and configure it:"
    print_status "cp env.example .env"
    print_status "nano .env"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB" "JWT_SECRET" "INTERNAL_API_KEY")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

# Create backup if enabled
if [[ "$BACKUP_ENABLED" == true ]]; then
    print_status "Creating database backup..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backups/faceid_backup_${ENVIRONMENT}_${timestamp}.sql"
    
    mkdir -p backups
    
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$backup_file"
        print_success "Database backup created: $backup_file"
    else
        print_warning "pg_dump not found, skipping database backup"
    fi
fi

# Build and deploy with Docker Compose
print_status "Building and deploying application..."

# Set environment-specific variables
export ENV="$ENVIRONMENT"
if [[ -n "$DOMAIN" ]]; then
    export CORS_ORIGINS="https://$DOMAIN,http://$DOMAIN"
fi

# Deploy using docker-compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Application deployed successfully!"
    
    # Show service status
    print_status "Service status:"
    docker-compose ps
    
    # Show logs
    print_status "Recent logs:"
    docker-compose logs --tail=20
    
    # Show access information
    print_status "Access information:"
    echo "  API: http://localhost:${API_PORT:-8000}"
    echo "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
    echo "  API Docs: http://localhost:${API_PORT:-8000}/docs"
    
    if [[ -n "$DOMAIN" ]]; then
        echo "  Production URL: https://$DOMAIN"
    fi
    
else
    print_error "Deployment failed! Check logs:"
    docker-compose logs
    exit 1
fi

# Setup SSL if domain and email provided
if [[ -n "$DOMAIN" && -n "$SSL_EMAIL" && "$ENVIRONMENT" == "production" ]]; then
    print_status "Setting up SSL certificate..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        print_status "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Generate SSL certificate
    sudo certbot --nginx -d "$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive
    
    print_success "SSL certificate configured for $DOMAIN"
fi

print_success "Deployment completed successfully!"
print_status "Next steps:"
print_status "1. Test the application at the URLs above"
print_status "2. Configure monitoring and logging"
print_status "3. Set up automated backups"
print_status "4. Configure firewall rules if needed"
