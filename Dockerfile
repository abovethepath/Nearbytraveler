FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build frontend with vite
RUN npx vite build

# Build server WITHOUT bundling vite.ts (mark it as external)
# This ensures dist/index.js has no vite dependencies
RUN npx esbuild server/index.ts --platform=node --packages=external --external:./vite --bundle --format=esm --outdir=dist

# Verify no vite packages are imported in the production bundle
RUN echo "Checking for vite imports in production bundle..." && \
    if grep -q "@vitejs\|from \"vite\"\|from 'vite'" dist/index.js; then \
      echo "ERROR: vite still in bundle!" && exit 1; \
    else \
      echo "SUCCESS: No vite imports in production bundle"; \
    fi

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
