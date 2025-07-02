# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Vite
FROM node:20-alpine
WORKDIR /app

# Copy built assets and package files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/vite.config.ts ./

# Install dependencies to run the preview server
RUN npm install

# Expose the port Vite preview runs on
EXPOSE 4173

# Start the Vite preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
