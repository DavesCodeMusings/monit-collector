FROM node:alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY collector.js .
COPY client ./client
EXPOSE 8008
CMD [ "node", "collector.js" ]
