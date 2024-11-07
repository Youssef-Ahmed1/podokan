module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
};