FROM node:alpine
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY ./models ./models
COPY ./public ./public
COPY ./routers ./routers
COPY ./index.js ./
COPY ./token_verification.js ./
COPY ./.env ./
CMD [ "npm", "start" ]

