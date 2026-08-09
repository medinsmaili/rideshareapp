# Use Node 20
FROM node:20-alpine

WORKDIR /app

# 1. Install Dependencies
COPY package*.json ./
# CRITICAL: Install NestJS CLI globally so 'nest build' works
RUN npm install -g @nestjs/cli
RUN npm install

# 2. Copy Source Code
COPY . .

# 3. Build the Application
RUN npm run build

# 4. Start the App
# NOTICE: We point to 'dist/src/main' because of the nested build structure
CMD ["node", "dist/src/main"]