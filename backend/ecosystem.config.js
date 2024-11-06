module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000
    },
    max_memory_restart: "1G",
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};