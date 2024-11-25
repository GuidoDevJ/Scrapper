export const getRandomMilliseconds = () => {
  const minMinutes = 10;
  const maxMinutes = 25;
  const minMilliseconds = minMinutes * 60 * 1000; // 20 minutos a milisegundos
  const maxMilliseconds = maxMinutes * 60 * 1000; // 30 minutos a milisegundos

  const randomMilliseconds =
    Math.random() * (maxMilliseconds - minMilliseconds) + minMilliseconds;
  const roundedMinutes = Math.round(randomMilliseconds / 60000); // Redondear los minutos

  console.log(`A esperar ${roundedMinutes} minutos`);

  return Math.round(randomMilliseconds); // Redondea a milisegundos completos
};
