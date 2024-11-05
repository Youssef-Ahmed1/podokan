module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "cluster",
    watch: ["./"],
    ignore_watch: [
      "node_modules",
      "uploads",
      "logs",
      ".git"
    ],
    env_production: {
      NODE_ENV: "PRODUCTION",
      PORT: 8000
    },
    max_memory_restart: "1G",
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    listen_timeout: 50000,
    kill_timeout: 5000
  }]
};