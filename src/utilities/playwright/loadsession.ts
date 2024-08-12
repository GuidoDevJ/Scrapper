// import * as fs from 'fs';
// import { chromium, Page } from 'playwright';
// import { getRandomUserAgent } from '../randomUsersAgents';
// const sessionFilePath = './sessionCookies.json';
// const usersInstagram = './userInstagram.json';
// // Función para obtener un usuario aleatorio del archivo JSON
// const getRandomUser = async () => {
//   const users = JSON.parse(fs.readFileSync(usersInstagram, 'utf-8'));
//   const randomIndex = Math.floor(Math.random() * users.length);
//   return users[randomIndex];
// };
// // Función para eliminar la sesión
// export async function deleteSession() {
//   try {
//     if (fs.existsSync(sessionFilePath)) {
//       fs.unlinkSync(sessionFilePath);
//       console.log('Sesión eliminada exitosamente.');
//     } else {
//       console.log('No se encontró ninguna sesión para eliminar.');
//     }
//   } catch (error) {
//     console.error('Error al eliminar la sesión:', error);
//   }
// }
// // Función para guardar las cookies en un archivo
// export async function saveSession(context: any) {
//   try {
//     const cookies = await context.cookies();
//     fs.writeFileSync(sessionFilePath, JSON.stringify(cookies, null, 2));
//     console.log('Sesión guardada exitosamente.');
//   } catch (error) {
//     console.error('Error al guardar la sesión:', error);
//   }
// }

// // Función para cargar las cookies desde un archivo
// export async function loadSession(context: any) {
//   try {
//     if (fs.existsSync(sessionFilePath)) {
//       const cookies = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
//       for (const cookie of cookies) {
//         await context.addCookies([cookie]);
//       }
//       console.log('Sesión cargada exitosamente.');
//       return true;
//     } else {
//       console.log(
//         'No se encontraron cookies de sesión, se procederá a iniciar sesión.'
//       );
//       return false;
//     }
//   } catch (error) {
//     console.error('Error al cargar la sesión:', error);
//     return false;
//   }
// }

// // Función para iniciar sesión
// export const loginInstagram = async () => {
//   const browser = await chromium.launch({
//     headless: false,
//   });
//   const userAgent = getRandomUserAgent();
//   let context = await browser.newContext({
//     userAgent: userAgent,
//   });
//   const page = await context.newPage();
//   const user = await getRandomUser();
//   console.log('Iniciando Session con ==>', user);

//   try {
//     await page.goto('https://www.instagram.com/accounts/login/', {
//       waitUntil: 'networkidle',
//     });
//     await page.waitForTimeout(5000); // Ajusta esto según tu necesidad

//     await page.fill('input[name="username"]', user.instagramUsername || '');
//     await page.fill('input[name="password"]', user.instagramPassword || '');
//     await page.click('button[type="submit"]');
//     await page.waitForTimeout(5000); // Ajusta esto según tu necesidad
//     await saveSession(page.context());
//     await browser.close();
//     console.log('Inicio de sesión exitoso.');
//   } catch (error) {
//     console.error('Error al iniciar sesión:', error);
//   }
// };

// // Función principal para cargar sesión e iniciar sesión si es necesario
// export const loadSessionAndLogin = async (page: Page) => {
//   try {
//     const context = page.context();
//     const cookies = await loadSession(context);

//     await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' });

//     if (!cookies) {
//       await loginInstagram();
//     } else {
//       console.log(
//         'Sesión cargada exitosamente, no es necesario iniciar sesión.'
//       );
//     }
//   } catch (error) {
//     console.error(
//       'Error en el proceso de carga de sesión e inicio de sesión:',
//       error
//     );
//   }
// };

import * as fs from 'fs';
import { chromium, Page } from 'playwright';
import { getRandomUserAgent } from '../randomUsersAgents';

const usersInstagram = './userInstagram.json';

// Función para obtener un usuario aleatorio del archivo JSON
export const getRandomUser = async () => {
  const users = JSON.parse(fs.readFileSync(usersInstagram, 'utf-8'));
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
};

// Función para eliminar la sesión de un usuario específico
export async function deleteSession(user: any) {
  const sessionFilePath = `./sessionCookies_${user.instagramUsername}.json`;

  try {
    if (fs.existsSync(sessionFilePath)) {
      fs.unlinkSync(sessionFilePath);
      console.log(
        `Sesión de ${user.instagramUsername} eliminada exitosamente.`
      );
    } else {
      console.log(
        `No se encontró ninguna sesión para ${user.instagramUsername}.`
      );
    }
  } catch (error) {
    console.error(
      `Error al eliminar la sesión de ${user.instagramUsername}:`,
      error
    );
  }
}

// Función para guardar las cookies en un archivo con el nombre del usuario
export async function saveSession(context: any, user: any) {
  const sessionFilePath = `./sessionCookies_${user.instagramUsername}.json`;

  try {
    const cookies = await context.cookies();
    fs.writeFileSync(sessionFilePath, JSON.stringify(cookies, null, 2));
    console.log(`Sesión de ${user.instagramUsername} guardada exitosamente.`);
  } catch (error) {
    console.error(
      `Error al guardar la sesión de ${user.instagramUsername}:`,
      error
    );
  }
}

// Función para cargar las cookies desde un archivo con el nombre del usuario
export async function loadSession(context: any, user: any) {
  const sessionFilePath = `./sessionCookies_${user.instagramUsername}.json`;

  try {
    if (fs.existsSync(sessionFilePath)) {
      const cookies = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
      for (const cookie of cookies) {
        await context.addCookies([cookie]);
      }
      console.log(`Sesión de ${user.instagramUsername} cargada exitosamente.`);
      return true;
    } else {
      console.log(
        `No se encontraron cookies de sesión para ${user.instagramUsername}, se procederá a iniciar sesión.`
      );
      return false;
    }
  } catch (error) {
    console.error(
      `Error al cargar la sesión de ${user.instagramUsername}:`,
      error
    );
    return false;
  }
}

// Función para iniciar sesión
export const loginInstagram = async (user: any) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Iniciando sesión con ==>', user.instagramUsername);

  try {
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(5000); // Ajusta esto según tu necesidad

    await page.fill('input[name="username"]', user.instagramUsername || '');
    await page.fill('input[name="password"]', user.instagramPassword || '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(80000); // Ajusta esto según tu necesidad
    await saveSession(page.context(), user);
    await browser.close();
    console.log('Inicio de sesión exitoso.');
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
  }
};

// Función principal para cargar sesión e iniciar sesión si es necesario
export const loadSessionAndLogin = async (page: Page, user: any) => {
  try {
    const context = page.context();
    const cookies = await loadSession(context, user);

    await page.goto('https://www.instagram.com', { waitUntil: 'networkidle' });

    if (!cookies) {
      await loginInstagram(user);
    } else {
      console.log(
        `Sesión cargada exitosamente para ${user.instagramUsername}, no es necesario iniciar sesión.`
      );
    }
  } catch (error) {
    console.error(
      `Error en el proceso de carga de sesión e inicio de sesión para ${user.instagramUsername}:`,
      error
    );
  }
};
