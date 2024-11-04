module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "cluster",
    watch: ["./"], // Enable watch mode
    ignore_watch: [
      "node_modules",
      "uploads",
      "logs",
      ".git",
      "*.log"
    ],
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "PRODUCTION"
    },
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    time: true,
    max_restarts: 10,
    restart_delay: 4000,
    listen_timeout: 50000,
    kill_timeout: 5000
  }]
};