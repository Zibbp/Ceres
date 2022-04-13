
FROM node:16-alpine3.12 as builder

ENV NODE_ENV build

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN yarn install --immutable --immutable-cache --check-cache \
    && yarn run build

# ---

FROM node:16-alpine3.12

ENV NODE_ENV production

# Install dependencies (ffmpeg, twitchdownloader, Inter font)
RUN apk update \
    && apk add bash icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib ffmpeg py3-pip libxml2-dev libxslt-dev python-dev gcc g++

RUN pip3 install lxml

WORKDIR /tmp

COPY ./Inter.otf ./

RUN mkdir -p /usr/share/fonts/opentype/

RUN install -m644 ./Inter.otf /usr/share/fonts/opentype/Inter.otf

RUN rm ./Inter.otf

ARG TWITCHDOWNLOADER_VERSION=1.40.7

WORKDIR /usr/bin

RUN wget https://github.com/lay295/TwitchDownloader/releases/download/$TWITCHDOWNLOADER_VERSION/TwitchDownloaderCLI-LinuxAlpine-x64.zip \
    && unzip TwitchDownloaderCLI-LinuxAlpine-x64.zip \
    && chmod +x TwitchDownloaderCLI \
    && rm TwitchDownloaderCLI-LinuxAlpine-x64.zip

RUN pip install streamlink chat-downloader

ENV PATH="~/.local/bin:$PATH"

USER node
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json /usr/src/app/
COPY --from=builder /usr/src/app/node_modules/ /usr/src/app/node_modules/
COPY --from=builder /usr/src/app/dist/ /usr/src/app/dist/

CMD ["node", "dist/main.js"]
