# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl (required for Prisma to run migrations in builder)
RUN apk add --no-cache openssl

# Copy configuration files
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the backend source code
COPY src ./src
COPY scripts ./scripts
COPY assets ./assets
COPY *.csv ./

# Generate Prisma Client and build the TypeScript application
RUN npx prisma generate
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl, chromium, and Python dependencies
RUN apk add --no-cache openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont \
    python3 py3-pip py3-numpy py3-pandas py3-scipy py3-scikit-learn openmp

# Install build dependencies, build lightgbm/sqlalchemy/dotenv, then clean up build dependencies
RUN apk add --no-cache --virtual .build-deps gcc g++ make cmake openmp-dev python3-dev musl-dev openblas-dev && \
    pip3 install --break-system-packages lightgbm SQLAlchemy psycopg2-binary python-dotenv python-docx && \
    apk del .build-deps

# Copy package configurations and prisma files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JS files and prisma client binaries from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/scripts ./scripts

# Expose backend port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Start command
CMD ["node", "dist/server.js"]
