module.exports = {
  apps: [
    {
      name: 'instagram-spider-playwright', // Nombre de la aplicación en PM2
      script: './build/index.js', // Ruta del archivo principal de la aplicación
      instances: 1, // Número de instancias que se ejecutarán (puede ser un número o 'max' para usar todos los núcleos de CPU disponibles)
      autorestart: true, // Reiniciar la aplicación automáticamente si se cierra
      watch: false, // Observar cambios en los archivos para reiniciar automáticamente (puede ser true o un array de rutas)
      max_memory_restart: '1G', // Reiniciar la aplicación si utiliza más memoria de la especificada (por ejemplo, '1G' para 1 GB)
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
