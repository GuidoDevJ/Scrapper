export const subdivideArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    console.log('text', i);
    result.push(array.slice(i, i + size));
  }

  return result;
};
