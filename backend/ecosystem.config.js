// ecosystem.config.js
module.exports = {
  apps: [{
    name: "podokan",
    script: "./server.js",
    instances: 1, // Single instance for proper database connection handling
    exec_mode: "fork", // Change to fork mode for better error handling
    watch: false, // Disable watch to prevent restart loops
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    max_restarts: 5,
    restart_delay: 5000,
    wait_ready: true,
    listen_timeout: 50000,
    kill_timeout: 15000,
    autorestart: true,
    exp_backoff_restart_delay: 100
  }]
};