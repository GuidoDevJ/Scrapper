export const getTime = () => {
  const time = Date.now();
  const date = new Date(time);
  return date.toUTCString();
};
