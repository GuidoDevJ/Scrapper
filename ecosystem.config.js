module.exports = {
  apps: [
    {
      name: 'instaScrapper',
      script: 'index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: true,
      env: {
        NODE_ENV: 'production',
        TS_NODE_PROJECT: 'tsconfig.json',
      },
      interpreter: 'bun',
      node_args: '-r ts-node/register',
    },
  ],
};
