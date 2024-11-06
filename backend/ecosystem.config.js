module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000
    },
    watch: false,
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    max_memory_restart: "1G",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    env: {
      NODE_ENV: "PRODUCTION"
    }
  }]
};