import * as fs from 'fs';

// Archivo donde guardarás tus proxies
const proxyFilePath = './proxies.json';

// Función para obtener un proxy aleatorio
export const getRandomProxy = () => {
  const proxies = JSON.parse(fs.readFileSync(proxyFilePath, 'utf-8'));
  const randomIndex = Math.floor(Math.random() * proxies.length);
  const proxy = proxies[randomIndex];
  const [server, port, username, password] = proxy.split(':');
  console.log(`${server}:${port}`);
  return { server: `${server}:${port}`, username, password };
};
