#!/bin/bash
# /var/www/podokan/deploy.sh

echo "Deploying application..."

# Go to project directories
cd /var/www/podokan

# Pull latest changes
git add .
git commit -m 'save'
git pull origin main
git merge

# Frontend build
cd frontend
yarn build
# Backend deployment
cd ../backend

# PM2 restart
pm2 delete all
pm2 flush
pm2 start ecosystem.config.js
pm2 save

# Nginx restart
sudo systemctl restart nginx
sudo pm2 restart all 
echo "Deployment completed!"