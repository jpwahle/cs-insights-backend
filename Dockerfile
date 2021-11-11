FROM node:10

RUN mkdir /api-server
WORKDIR /api-server
COPY ./ /api-server

ENV NODE_ENV=production
RUN npm install --production
RUN npm run build --prod