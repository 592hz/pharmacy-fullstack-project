# Use Node.js 20-slim as base
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Expose port 2222
EXPOSE 2222

# Serve with Vite preview
CMD ["npx", "vite", "preview", "--host", "--port", "2222"]
