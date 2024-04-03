# Stage 1: Build the backend and frontend
FROM node:20.12.0-alpine3.19 as builder
WORKDIR /app/backend
COPY backend/package*.json ./

RUN npm install

COPY backend/ ./
COPY shared/ ../shared

RUN npm run build


WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

FROM node:20.12.0-alpine3.19

WORKDIR /app

# Copy the built backend and frontend from the builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist

# Command to run the backend
ENTRYPOINT ["node", "backend/dist/backend/src/index.js"]