FROM node:18

RUN mkdir /cs-insights-backend
WORKDIR /cs-insights-backend
COPY ./ /cs-insights-backend

ENV NODE_ENV=production
RUN npm install
RUN npm run prebuild
RUN npm run build --omit=dev