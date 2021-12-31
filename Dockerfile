FROM node:16-alpine3.12 as builder

ENV NODE_ENV build

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN yarn install --immutable --immutable-cache --check-cache \
    && yarn run build

# ---

FROM node:16-alpine3.12

ENV NODE_ENV production

USER node
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json /usr/src/app/
COPY --from=builder /usr/src/app/node_modules/ /usr/src/app/node_modules/
COPY --from=builder /usr/src/app/dist/ /usr/src/app/dist/

CMD ["node", "dist/main.js"]