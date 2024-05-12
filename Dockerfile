# Base image
FROM node:20-alpine as builder

RUN apk add vips-dev libheif alpine-sdk

WORKDIR /app

COPY --chown=node:node . .

RUN npm ci

RUN npm run build

RUN rm -rf node_modules && \
  NODE_ENV=production npm ci

FROM node:20-alpine

RUN apk add vips-dev libheif

WORKDIR /app

COPY --from=builder --chown=node:node /app  .

USER node

ARG NODE_ENV=production
ARG HOST=0.0.0.0
#ARG PORT=3100
#ARG API_URL=http://localhost:4500

EXPOSE 4500

CMD ["npm", "run", "start:prod"]
