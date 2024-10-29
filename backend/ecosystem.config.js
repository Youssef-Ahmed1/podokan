module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: "max",
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000,
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: 465,
      SMTP_SERVICE: "gmail",
      SMTP_MAIL: "moropass1212@gmail.com",
      SMTP_PASSWORD: "your_app_specific_password",
      JWT_SECRET_KEY: "your_jwt_secret",
      ACTIVATION_SECRET: "your_activation_secret",
      CLOUDINARY_NAME: "your_cloudinary_name",
      CLOUDINARY_API_KEY: "your_cloudinary_api_key",
      CLOUDINARY_API_SECRET: "your_cloudinary_secret",
      MONGO_URI: "your_mongodb_uri"
    }
  }]
};
