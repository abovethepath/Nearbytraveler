FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install all deps for build, then prune for production
RUN npm ci

COPY . .

# Build the app (needs dev deps)
RUN npm run build

# Remove dev dependencies for smaller production image
RUN npm prune --production

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
