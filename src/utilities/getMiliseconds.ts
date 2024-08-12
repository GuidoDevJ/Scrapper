export const getRandomMilliseconds = () => {
  const minHours = 1;
  const maxHours = 2.5;
  const minMilliseconds = minHours * 60 * 60 * 1000;
  const maxMilliseconds = maxHours * 60 * 60 * 1000;

  const randomMilliseconds =
    Math.random() * (maxMilliseconds - minMilliseconds) + minMilliseconds;
  const roundedHours = Math.round(randomMilliseconds / 3600000); // Redondear las horas

  console.log(`A esperar ${roundedHours}hs`);

  return Math.round(randomMilliseconds); // Redondea a milisegundos completos
};
