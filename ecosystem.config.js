module.exports = {
  apps: [
    {
      name: 'instagram-spider-playwright', // Nombre de la aplicación en PM2
      script: './build/index.js', // Ruta del archivo principal de la aplicación
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        // Variables de entorno para el entorno de desarrollo
        NODE_ENV: 'development',
      },
      env_production: {
        // Variables de entorno para el entorno de producción
        NODE_ENV: 'production',
      },
    },
  ],
};
