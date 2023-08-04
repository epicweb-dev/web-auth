FROM node:18-bookworm-slim as base

RUN apt-get update && apt-get install -y git

ENV KCDSHOP_CONTEXT_CWD="/myapp/workshop-content"
ENV KCDSHOP_DEPLOYED="true"
ENV FLY="true"
ENV PORT="8080"
ENV NODE_ENV="production"

WORKDIR /myapp

ADD . .

RUN npm install --omit=dev

CMD git clone https://github.com/epicweb-dev/web-auth ${KCDSHOP_CONTEXT_CWD} && \
    cd ${KCDSHOP_CONTEXT_CWD} && \
    npx kcdshop start
