# Use the official Node.js image as the base image
FROM node:20-bookworm

# Install Playwright and its dependencies
RUN npx -y playwright@1.45.1 install --with-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci
# Instala PM2 globalmente
RUN npm install -g pm2

# Configura las claves públicas y secretas de PM2
ENV PM2_PUBLIC_KEY q37ei1gxbc6luaq
ENV PM2_SECRET_KEY l40xw63ilgzfmx0

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Compila el proyecto TypeScript
RUN npm run build

# Comando para ejecutar tu aplicación usando PM2
CMD ["npm", "start"]
