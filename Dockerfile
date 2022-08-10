FROM node:18

RUN mkdir /cs-insights-backend
WORKDIR /cs-insights-backend
COPY ./ /cs-insights-backend

RUN npm install
RUN npm run build --omit=dev