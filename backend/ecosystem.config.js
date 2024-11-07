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
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    time: true
  }]
};