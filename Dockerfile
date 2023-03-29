FROM node:10-alpine as dtw

WORKDIR /dtw
COPY ./dtw /dtw

RUN npm install

FROM node:10-alpine as prod

WORKDIR /anchor
COPY ./anchor /anchor

RUN npm install

COPY --from=dtw /dtw /dtw

EXPOSE 9000

CMD ["node", "server.js"]
