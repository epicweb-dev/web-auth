FROM node:24-bookworm-slim as base

RUN apt-get update && apt-get install -y git

ENV EPICSHOP_REPO=https://github.com/epicweb-dev/web-auth
ENV EPICSHOP_CONTEXT_CWD="/myapp/workshop-content"
ENV EPICSHOP_DEPLOYED="true"
ENV EPICSHOP_DISABLE_WATCHER="true"
ENV FLY="true"
ENV PORT="8080"
ENV NODE_ENV="production"

WORKDIR /myapp

# Clone the workshop repo during build time, excluding database files
RUN git clone --depth 1 ${EPICSHOP_REPO} ${EPICSHOP_CONTEXT_CWD} && \
    find ${EPICSHOP_CONTEXT_CWD} -name "data.db" -delete

ADD . .

RUN npm install --omit=dev

RUN echo "🔥 Warming up cache..." && \
    cd ${EPICSHOP_CONTEXT_CWD} && \
    npx epicshop warm

CMD echo "⚡ Starting up..." && \
    cd ${EPICSHOP_CONTEXT_CWD} && \
    npx epicshop start
