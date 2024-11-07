#!/bin/bash
# /var/www/podokan/deploy.sh

echo "Deploying application..."

# Go to project directory
cd /var/www/podokan

# Pull latest changes
git pull origin main

# Frontend build
cd frontend
yarn add 
yarn build
# Backend deployment
cd ../backend
npm install

# PM2 restart
pm2 delete all
pm2 flush
pm2 start ecosystem.config.js
pm2 save

# Nginx restart
sudo systemctl restart nginx

echo "Deployment completed!"