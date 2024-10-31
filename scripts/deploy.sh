#!/bin/bash

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build frontend
cd /var/www/podokan/frontend
yarn add 	
yarn  build

# Restart backend
cd /var/www/podokan/backend
pm2 restart podokan

# Reload Nginx
sudo systemctl reload nginx

echo "Deployment completed!"
