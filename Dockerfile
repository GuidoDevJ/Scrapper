# Start with a base Docker image that includes Playwright and a specific browser version.
FROM mcr.microsoft.com/playwright:v1.45.3-jammy

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "start:dev-account"]