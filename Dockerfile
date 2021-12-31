FROM node:16.8-alpine3.12 as builder

ENV NODE_ENV build

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm ci \
    && npm run build \
    && npm prune --production

# ---

FROM node:16.8-alpine3.12

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=builder /home/node/package*.json /usr/src/app
COPY --from=builder /home/node/node_modules/ /usr/src/app/node_modules/
COPY --from=builder /home/node/dist/ /usr/src/app/dist/

CMD ["node", "dist/main.js"]