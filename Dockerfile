FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including dev) - needed because dist/index.js imports vite
RUN npm ci

COPY . .

# Build the app
RUN npm run build

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
