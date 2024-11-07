module.exports = {
  apps: [{
    name: "podokan",
    script: "server.js",
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "1G",
    kill_timeout: 10000,    // Give process 10 seconds to clean up
    wait_ready: true,       // Wait for ready signal
    listen_timeout: 10000,  // Wait 10s for listen
    env: {
      NODE_ENV: "production",
      PORT: 8000
    }
  }]
};