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
    node_args: ['--max-old-space-size=2048'],
    kill_timeout: 5000,
    wait_ready: true,
    shutdown_with_message: true,
    listen_timeout: 10000,
    max_restarts: 10,
    restart_delay: 4000,
    error_file: "/root/.pm2/logs/podokan-error.log",
    out_file: "/root/.pm2/logs/podokan-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};