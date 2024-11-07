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
    env_production: {
      NODE_ENV: "production"
    },
    node_args: ['--max-old-space-size=2048'],
    kill_timeout: 3000,
    wait_ready: false,
    listen_timeout: 30000,
    time: true
  }]
};