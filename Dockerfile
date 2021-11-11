FROM node:14

RUN mkdir /api-server
WORKDIR /api-server
COPY ./ /api-server

ENV NODE_ENV=production
RUN npm install --production

# TODO: Switch the lines below to build the app in production mode.
# Currently some strict typing is not working which we need to fix
RUN npm run build
# RUN npm run build --prod
