// ecosystem.config.js
module.exports = {
  apps: [{
    name: "podokan",
    script: "./server.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "300M",
    node_args: "--max-old-space-size=300",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true
  }]
};