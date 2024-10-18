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

import * as fs from 'fs';
import path from 'path';
import { BrowserContext, Cookie, Page } from 'playwright';
import { solveSlideCaptcha } from '../resolveCaptcha';

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
export async function loadSession(context: BrowserContext, user: any) {
  const sessionFilePath = `./sessionCookies_${user.instagramUsername}.json`;
  try {
    if (fs.existsSync(sessionFilePath)) {
      const cookies: Cookie[] = JSON.parse(
        fs.readFileSync(sessionFilePath, 'utf-8')
      );

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
export const loginInstagram = async (page: Page, user: any, context: any) => {
  console.log('Iniciando sesión con ==>', user.instagramUsername);

  try {
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(5000); // Ajusta esto según tu necesidad

    await page.fill('input[name="username"]', user.instagramUsername || '');
    await page.fill('input[name="password"]', user.instagramPassword || '');
    await page.click('button[type="submit"]');
    // await saveSession(page.context(), user);

    // Guarda el estado de almacenamiento local y cookies en un archivo
    // await context.storageState({ path: 'instagram.json' });
    await page.waitForTimeout(10000); // Ajusta esto según tu necesidad
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
      await loginInstagram(page, user, context);
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

export const loginTiktok = async (page: Page, browser: any, user: any) => {
  const sessionPath = path.resolve('tiktok-session.json'); // Archivo donde se guarda la sesión

  // Si ya existe el archivo de sesión, cargarlo
  let context;
  if (fs.existsSync(sessionPath)) {
    console.log('Sesión encontrada, cargando sesión...');
    context = await browser.newContext({ storageState: sessionPath });
  } else {
    console.log('No se encontró sesión, iniciando nuevo login...');
    context = await browser.newContext();
  }

  // Navega a TikTok
  await page.goto('https://www.tiktok.com/login');

  // Si estamos en la página de login, entonces necesitamos iniciar sesión
  if (page.url().includes('/login')) {
    console.log('Página de login detectada, iniciando sesión...');
    // Esperar que los campos de usuario y contraseña estén visibles
    // await page.waitForSelector('input[placeholder="Email or username"]');
    // Hacer click en el elemento que contiene el texto 'email'
    await page.click('text=correo');
    await page.click(
      'text=Iniciar sesión con un correo electrónico o nombre de usuario'
    );
    // Completa los campos de login con tus credenciales
    await page.fill(
      'input[placeholder="Correo electrónico o nombre de usuario"]',
      'guidogauna9@gmail.com'
    ); // Reemplaza con tu usuario
    await page.fill('input[placeholder="Contraseña"]', 'Mama*154595757'); // Reemplaza con tu contraseña

    // Clic en el botón de iniciar sesión
    await page.click('button:has-text("Iniciar sesión")');
    await page.waitForTimeout(5000);
    const captchaElement = await page.waitForSelector('canvas'); // Ajusta el selector según la página
    console.log('CAPTCHA detectado');

    // Capturar la imagen del CAPTCHA (puede ser un canvas o imagen, ajusta el selector)
    const captchaImagePath = path.resolve(__dirname, 'captcha.png');
    await captchaElement.screenshot({ path: captchaImagePath });

    // Leer la imagen y convertirla a base64
    const imageBase64 = fs.readFileSync(captchaImagePath, {
      encoding: 'base64',
    });

    // Resolver el CAPTCHA usando 2Captcha
    const captchaSolution = await solveSlideCaptcha(imageBase64);

    // Aquí se implementaría la lógica para usar la solución del captcha en la página.
    // Dependiendo del tipo de CAPTCHA, la solución puede requerir un click o un desplazamiento
    // Simular el deslizamiento hacia la solución proporcionada

    // Esto depende de cómo sea el captcha exacto y la respuesta que devuelve 2Captcha.
    // Puedes simular el arrastre de la pieza usando Playwright
    const slider = (await page.$('selector-del-slider')) as any; // Reemplaza con el selector del slider
    const sliderBox = await slider.boundingBox();

    // Mover el slider basándote en la solución del CAPTCHA
    await page.mouse.move(
      sliderBox.x + sliderBox.width / 2,
      sliderBox.y + sliderBox.height / 2
    );
    await page.mouse.down();
    await page.mouse.move(
      sliderBox.x + parseInt(captchaSolution),
      sliderBox.y + sliderBox.height / 2,
      { steps: 10 }
    );
    await page.mouse.up();

    console.log('CAPTCHA resuelto y verificado');
    // Verificar si el login fue exitoso
    if (page.url().includes('/login')) {
      console.log(
        'Error: Login fallido. Verifica tus credenciales o si hay un captcha.'
      );
    } else {
      console.log('Login exitoso.');

      // Guardar la sesión para futuras ejecuciones
      await context.storageState({ path: sessionPath });
      await page.waitForTimeout(5000);
      console.log('Sesión guardada en:', sessionPath);
    }
  } else {
    console.log('Ya estás logueado.');
  }
};
