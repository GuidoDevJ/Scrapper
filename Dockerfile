FROM node:18.18.2-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache \
    chromium \
    udev \
    ttf-freefont

# Instalar Playwright y configurar los navegadores
RUN npx playwright install

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY . .

# RUN npm run build

EXPOSE 3005

CMD [ "npm", "run","dev" ]