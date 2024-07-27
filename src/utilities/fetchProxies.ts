import * as fs from 'fs';
import path from 'path';
import { envs } from '../config';

const url = `${envs.proxyUrl}`;
const outputDir = path.join(__dirname, '..', '..');
const outputFile = path.join(outputDir, 'proxies.json');

export function fetchProxies(): Promise<void> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        const proxies = data.split('\n').filter((proxy) => proxy.trim() !== '');

        const timestamp = new Date().toISOString();
        const result = { timestamp, proxies };

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFile(
          outputFile,
          JSON.stringify(result, null, 2),
          'utf8',
          (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Proxies updated successfully at', timestamp);
              resolve();
            }
          }
        );
      })
      .catch((error) => {
        console.log('Entre en el error del fetch Proxies ==>', error);
        reject(error);
      });
  });
}
