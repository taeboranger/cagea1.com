module.exports = {
  apps: [
    {
      name: "cagea1",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      // Cluster mode lets `pm2 reload` start the new process before killing
      // the old one, so requests are never dropped during a deploy. A single
      // instance is enough here (this app writes to local JSON files without
      // locking, so running more than one at a time risks a lost write).
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
