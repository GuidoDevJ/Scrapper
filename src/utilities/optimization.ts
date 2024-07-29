import { Page } from 'playwright';

// Función para obtener un tiempo de espera aleatorio
export const randomTimeout = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Función para reintentar operaciones en caso de error
export const retryOperation = async (
  page: Page,
  operation: () => {},
  retries = 3
) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i < retries - 1) {
        await page.waitForTimeout(randomTimeout(5000, 10000));
      } else {
        throw error;
      }
    }
  }
};
