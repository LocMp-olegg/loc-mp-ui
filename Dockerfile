FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run generate:api

ARG VITE_API_BASE_URL
ARG VITE_DADATA_KEY
ARG VITE_DADATA_SECRET
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_DADATA_KEY=$VITE_DADATA_KEY \
    VITE_DADATA_SECRET=$VITE_DADATA_SECRET

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
