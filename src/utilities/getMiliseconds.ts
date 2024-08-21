export const getRandomMilliseconds = () => {
  const minMinutes = 20;
  const maxMinutes = 30;
  const minMilliseconds = minMinutes * 60 * 1000; // 20 minutos a milisegundos
  const maxMilliseconds = maxMinutes * 60 * 1000; // 30 minutos a milisegundos

  const randomMilliseconds =
    Math.random() * (maxMilliseconds - minMilliseconds) + minMilliseconds;
  const roundedMinutes = Math.round(randomMilliseconds / 60000); // Redondear los minutos

  console.log(`A esperar ${roundedMinutes} minutos`);

  return Math.round(randomMilliseconds); // Redondea a milisegundos completos
};
