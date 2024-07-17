# Use the official Node.js image as the base image
FROM node:20-bookworm

# Install Playwright and its dependencies
RUN npx -y playwright@1.45.1 install --with-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "run","dev"]