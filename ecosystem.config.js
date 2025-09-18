module.exports = {
  apps: [
    // Backend: production
    {
      name: "vr-coma-backend",
      cwd: "/home/group31/vr.COMA/vr.COMA_SPA/backend",
      // Use npm start (same as your systemd ExecStart)
      script: "npm",
      args: "start",
      // If you use nvm, uncomment PATH and fix node version
      // env: {
      //   PATH: "/home/group31/.nvm/versions/node/v20.11.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      // },
      env: {
        NODE_ENV: "production"
      },
      instances: 1,
      exec_mode: "fork",
      restart_delay: 5000,
      max_memory_restart: "512M",
      out_file: "/home/group31/.pm2/logs/vr-coma-backend.out.log",
      error_file: "/home/group31/.pm2/logs/vr-coma-backend.err.log",
      merge_logs: true
    },

    // Frontend: dev server via `npm start` (CRA/Vite/etc.)
    {
      name: "vr-coma-frontend",
      cwd: "/home/group31/vr.COMA/vr.COMA_SPA/frontend",
      script: "npm",
      args: "start",
      // IMPORTANT: do NOT set NODE_ENV=production for a dev server
      env: {
        HOME: "/home/group31",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
      },
      instances: 1,
      exec_mode: "fork",
      restart_delay: 5000,
      max_memory_restart: "512M",
      out_file: "/home/group31/.pm2/logs/vr-coma-frontend.out.log",
      error_file: "/home/group31/.pm2/logs/vr-coma-frontend.err.log",
      merge_logs: true
    }
  ]
};
