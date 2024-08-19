import * as fs from 'fs';

// Archivo donde guardarás tus proxies
const proxyFilePath = './proxies.json';

// Función para obtener un proxy aleatorio
export const getRandomProxy = () => {
  try {
    // Leer el archivo JSON y parsear el contenido
    const data = fs.readFileSync(proxyFilePath, 'utf-8');
    const { proxies } = JSON.parse(data);

    if (!proxies || proxies.length === 0) {
      throw new Error('No proxies available in the file.');
    }

    // Limpiar y preparar los proxies
    const cleanedProxies = proxies.map((proxy: string) => {
      // Eliminar el carácter '\r'
      const cleanedProxy = proxy.replace(/\r$/, '');
      return cleanedProxy;
    });

    // Seleccionar un proxy aleatorio
    const randomIndex = Math.floor(Math.random() * cleanedProxies.length);
    const proxy = cleanedProxies[randomIndex];

    // Separar los detalles del proxy
    const [server, port, username, password] = proxy.split(':');
    const protocol = 'http'; // Asumiendo que el protocolo es HTTP; ajusta según tus necesidades
    return { server: `${server}:${port}`, username, password, protocol };
  } catch (error: any) {
    // Manejo de errores
    console.error('Error getting random proxy:', error.message);
    return null; // Devuelve null si ocurre un error
  }
};
