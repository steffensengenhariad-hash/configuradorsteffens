FROM node:24.19.0-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=10000

COPY --chown=node:node package.json package-lock.json build.mjs server.mjs storage.mjs ./
COPY --chown=node:node public ./public

USER node
RUN node build.mjs

EXPOSE 10000
CMD ["node", "server.mjs"]
