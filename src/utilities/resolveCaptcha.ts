import axios from 'axios';

// Función para resolver el captcha de deslizar usando 2Captcha
export const solveSlideCaptcha = async (imageBase64: string) => {
  const apiKey = '';

  // Enviar el captcha a 2Captcha
  const response = await axios.post(`http://2captcha.com/in.php`, null, {
    params: {
      key: apiKey,
      method: 'base64',
      body: imageBase64,
      json: 1,
    },
  });

  const captchaId = response.data.request;
  console.log('Captcha enviado, esperando solución...');

  // Esperar hasta que se resuelva el captcha
  let captchaSolved = false;
  let captchaResult;
  while (!captchaSolved) {
    const result = await axios.get('http://2captcha.com/res.php', {
      params: {
        key: apiKey,
        action: 'get',
        id: captchaId,
        json: 1,
      },
    });

    if (result.data.status === 1) {
      captchaResult = result.data.request;
      captchaSolved = true;
      console.log('Captcha resuelto:', captchaResult);
    } else {
      console.log('Esperando solución del captcha...');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  return captchaResult;
};
