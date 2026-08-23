module.exports = {
  apps: [
    {
      name: 'vibe-crm',
      script: 'server.supabase.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      time: true,
      watch: false
    }
  ]
};
