module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000,
      DB_URL: "mongodb+srv://youssefahmed:zxczxcZXC123@cluster0.iv8sqpb.mongodb.net/podShop"
    },
    watch: true,
    max_memory_restart: '1G',
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};