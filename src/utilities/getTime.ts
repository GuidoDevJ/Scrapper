export const getTime = () => {
  const date = new Date();
  const argTime = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
  );
  return argTime;
};
