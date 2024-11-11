module.exports = {
  apps: [{
    name: "podokan",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
      PORT: 8000
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "production"
    }
  }]
};