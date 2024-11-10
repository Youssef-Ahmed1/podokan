module.exports = {
  apps: [{
    name: "podokan",
    script: "./server.js",
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    instance_var: 'INSTANCE_ID',
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    autorestart: true
  }]
};