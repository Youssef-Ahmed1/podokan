const path = require('path');

module.exports = {
  apps: [{
    name: "podokan",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    env_file: path.join(__dirname, 'config', '.env'),
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};