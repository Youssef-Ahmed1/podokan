module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: "max",
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000,
      DB_URL: "mongodb+srv://youssefahmed:zxczxcZXC123@cluster0.iv8sqpb.mongodb.net/podShop",
      JWT_SECRET_KEY: "a3ea75cf2028f52e821215ff6b02b24029b48554f0de85da847bdb755bd88641",
      JWT_EXPIRES: "7d",
      ACTIVATION_SECRET: "PWj0fI#&DsZY9w$8tHe11*yr9F45K*j2xj&fceGZ!tEnMNZcEN",
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: 465,
      SMTP_SERVICE: "gmail",
      SMTP_MAIL: "moropass1212@gmail.com",
      SMTP_PASSWORD: "zqkxjfttywkzisss",
      CLOUDINARY_NAME: "dkot9tyjm",
      CLOUDINARY_API_KEY: "411713446345318",
      CLOUDINARY_API_SECRET: "s01XENodwewxd9U4OuuzUB5-ij8"
    }
  }]
};