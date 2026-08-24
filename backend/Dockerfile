# Use Node.js 20-slim as base
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
