#!/bin/bash
set -e

# WAHA Deployment Script
# This script deploys the WAHA stack to a remote server

# Configuration
REMOTE_HOST="${1:-37.60.230.233}"
REMOTE_USER="${2:-root}"
DEPLOY_DIR="/opt/waha"

echo "🚀 WAHA Deployment Script"
echo "========================="
echo "Host: $REMOTE_HOST"
echo "User: $REMOTE_USER"
echo "Deploy Dir: $DEPLOY_DIR"
echo ""

# Check if we can connect
echo "📡 Testing SSH connection..."
ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connected successfully'" || {
    echo "❌ Cannot connect to $REMOTE_HOST"
    echo "Please ensure you have SSH access and try again."
    exit 1
}

echo "✅ SSH connection successful"
echo ""

# Install Docker if not present
echo "🐳 Checking Docker installation..."
ssh "$REMOTE_USER@$REMOTE_HOST" 'command -v docker >/dev/null 2>&1 || {
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
}'

# Install Docker Compose if not present
ssh "$REMOTE_USER@$REMOTE_HOST" 'command -v docker-compose >/dev/null 2>&1 || {
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
}'

echo "✅ Docker is installed"
echo ""

# Create deploy directory
echo "📁 Creating deployment directory..."
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $DEPLOY_DIR"

# Copy files
echo "📦 Copying files to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '*.db' \
    ./ "$REMOTE_USER@$REMOTE_HOST:$DEPLOY_DIR/"

echo "✅ Files copied"
echo ""

# Deploy
echo "🚀 Starting deployment..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $DEPLOY_DIR && docker-compose pull && docker-compose up -d --build"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your services:"
echo "   - Chatty Dashboard: http://$REMOTE_HOST"
echo "   - WAHA Control Panel: http://$REMOTE_HOST:8080"
echo "   - WAHA API: http://$REMOTE_HOST:3001"
echo "   - Backend API: http://$REMOTE_HOST:3002"
echo ""
echo "📋 Useful commands:"
echo "   View logs: ssh $REMOTE_USER@$REMOTE_HOST 'cd $DEPLOY_DIR && docker-compose logs -f'"
echo "   Stop: ssh $REMOTE_USER@$REMOTE_HOST 'cd $DEPLOY_DIR && docker-compose down'"
echo "   Restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $DEPLOY_DIR && docker-compose restart'"
