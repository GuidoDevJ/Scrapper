import * as fs from 'fs';
import { envs } from '../../config';
import { Page } from 'playwright';
const sessionFilePath = './sessionCookies.json';

// Función para guardar las cookies en un archivo
export async function saveSession(context: any) {
  try {
    const cookies = await context.cookies();
    fs.writeFileSync(sessionFilePath, JSON.stringify(cookies, null, 2));
    console.log('Sesión guardada exitosamente.');
  } catch (error) {
    console.error('Error al guardar la sesión:', error);
  }
}

// Función para cargar las cookies desde un archivo
export async function loadSession(context: any) {
  try {
    if (fs.existsSync(sessionFilePath)) {
      const cookies = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
      for (const cookie of cookies) {
        await context.addCookies([cookie]);
      }
      console.log('Sesión cargada exitosamente.');
      return true;
    } else {
      console.log(
        'No se encontraron cookies de sesión, se procederá a iniciar sesión.'
      );
      return false;
    }
  } catch (error) {
    console.error('Error al cargar la sesión:', error);
    return false;
  }
}

// Función para iniciar sesión
export const loginInstagram = async (page: Page) => {
  try {
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(5000); // Ajusta esto según tu necesidad

    await page.fill('input[name="username"]', envs.instagramUsername || '');
    await page.fill('input[name="password"]', envs.instagramPassword || '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000); // Ajusta esto según tu necesidad
    await saveSession(page.context());
    console.log('Inicio de sesión exitoso.');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
  }
};

// Función principal para cargar sesión e iniciar sesión si es necesario
export const loadSessionAndLogin = async (page: Page) => {
  try {
    const context = page.context();
    const cookies = await loadSession(context);

    await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' });

    if (!cookies) {
      console.log(
        'Sesión no válida, no existen las cookies , iniciando sesión...'
      );
      await loginInstagram(page);
    } else {
      console.log(
        'Sesión cargada exitosamente, no es necesario iniciar sesión.'
      );
    }
  } catch (error) {
    console.error(
      'Error en el proceso de carga de sesión e inicio de sesión:',
      error
    );
  }
};
