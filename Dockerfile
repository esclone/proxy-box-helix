# ========= build stage =========
FROM node:lts AS builder

WORKDIR /app

COPY . .

RUN corepack enable
RUN yarn install
RUN yarn run build


# ========= runtime stage =========
FROM node:lts-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/index.js"]
