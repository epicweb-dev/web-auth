FROM oven/bun:latest as base

ENV EPICSHOP_CONTEXT_CWD="/myapp/workshop-content"
ENV EPICSHOP_DEPLOYED="true"
ENV EPICSHOP_DISABLE_WATCHER="true"
ENV FLY="true"
ENV PORT="8080"
ENV NODE_ENV="production"

WORKDIR /myapp

# Install git for cloning the workshop template
RUN apt-get update && apt-get install -y git

ADD . .

RUN rm -f package-lock.json && bun install --production

CMD rm -rf ${EPICSHOP_CONTEXT_CWD} && \
    git clone --depth 1 https://github.com/epicweb-dev/web-auth ${EPICSHOP_CONTEXT_CWD} && \
    echo "repo cloned... Starting up." && \
    cd ${EPICSHOP_CONTEXT_CWD} && \
    bunx epicshop start
