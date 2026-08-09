#!/bin/bash

# Configuration
VPS_IP="164.68.113.147"
VPS_USER="root"
VPS_PATH="/opt/nisu"
ADMIN_DIST_FOLDER="admin-dist"

echo "🚀 Starting Admin Panel Deployment..."

# 1. Build the React project
echo "📦 Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

# 2. Prepare VPS and Upload files
echo "📤 Uploading files to $VPS_IP..."

# Using scp instead of rsync for better Windows compatibility
# First, ensure the folder exists on the VPS
ssh $VPS_USER@$VPS_IP "mkdir -p $VPS_PATH/$ADMIN_DIST_FOLDER"

# Upload the contents of the local dist folder to the VPS
# Note: we use ./dist/* to copy contents, not the folder itself
scp -r ./dist/* $VPS_USER@$VPS_IP:$VPS_PATH/$ADMIN_DIST_FOLDER/

# 3. Set Permissions and Restart Caddy on VPS
echo "🔧 Finalizing on VPS..."
ssh $VPS_USER@$VPS_IP << EOF
    cd $VPS_PATH
    chmod -R 755 $ADMIN_DIST_FOLDER
    docker compose up -d --force-recreate caddy
EOF

echo "✅ Deployment Complete! Visit https://admin.nisu.app"