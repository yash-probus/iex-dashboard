module.exports = {
  apps: [
    {
      name: "iex-backend",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
}
