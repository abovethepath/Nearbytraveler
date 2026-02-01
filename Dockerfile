FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including vite for safety)
RUN npm ci

COPY . .

# Build frontend with vite
RUN npx vite build

# Build server - keep vite external so it's loaded dynamically only in dev
RUN npx esbuild server/index.ts --platform=node --packages=external --external:./vite --bundle --format=esm --outdir=dist

# Copy vite.ts to dist as a safety net for the dynamic import
# This ensures ./vite resolves even if the dev branch is somehow reached
RUN npx esbuild server/vite.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/vite.js

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
