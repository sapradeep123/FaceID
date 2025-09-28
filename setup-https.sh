#!/bin/bash

# Setup HTTPS for FaceID Application
# This script generates self-signed SSL certificates for HTTPS camera access

echo "🔐 Setting up HTTPS for FaceID Application..."

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate
echo "📜 Generating self-signed SSL certificate..."
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=161.97.155.89"

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "✅ SSL certificates generated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update docker-compose.yml to use HTTPS configuration"
echo "2. Restart the frontend container"
echo "3. Access the application via: https://161.97.155.89:3000"
echo ""
echo "⚠️  Note: You'll need to accept the self-signed certificate in your browser"
echo "   This is normal for development/testing purposes"
