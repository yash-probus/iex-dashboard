# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy configuration files
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the backend source code
COPY src ./src

# Generate Prisma Client and build the TypeScript application
RUN npx prisma generate
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl (required for Prisma Client to run on alpine)
RUN apk add --no-cache openssl

# Copy package configurations and prisma files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JS files and prisma client binaries from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose backend port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start command
CMD ["node", "dist/server.js"]
