// ecosystem.config.js
module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    max_restarts: 5,
    restart_delay: 5000,
    autorestart: true
  }]
};