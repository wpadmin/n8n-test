FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Удалить devDependencies после сборки
RUN npm prune --production

RUN mkdir -p /app/sessions && chown node:node /app/sessions

EXPOSE 3000

USER node

CMD ["npm", "start"]
