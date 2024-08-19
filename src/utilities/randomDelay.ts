export const randomDelay = (min: number, max: number) => {
  return new Promise((resolve) => {
    const delay = Math.random() * (max - min) + min;
    setTimeout(resolve, delay);
  });
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
