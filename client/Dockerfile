FROM node:12.18.3-alpine

COPY . /

RUN apk add tzdata
ENV TZ="Asia/Jakarta"

RUN npm install

CMD ["node", "index"]