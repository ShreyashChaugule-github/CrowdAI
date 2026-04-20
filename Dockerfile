# Use official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy application code
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Expose port and run the app
EXPOSE 3000
WORKDIR /app/backend
CMD [ "node", "server.js" ]
