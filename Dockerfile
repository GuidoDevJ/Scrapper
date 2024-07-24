# Start with a base Docker image that includes Playwright and a specific browser version.
FROM mcr.microsoft.com/playwright:v1.45.3-jammy

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Install PM2 globally
RUN npm install -g pm2

# Configure the public and secret keys for PM2
ENV PM2_PUBLIC_KEY q37ei1gxbc6luaq
ENV PM2_SECRET_KEY l40xw63ilgzfmx0

RUN npm run build

CMD ["npm", "run", "start"]