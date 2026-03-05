FROM node:20-alpine

# Install Python & FFmpeg buat senjata yt-dlp
RUN apk add --no-cache python3 ffmpeg

WORKDIR /app

# Copy package.json saja (hindari package-lock biar gak bentrok OS)
COPY package.json ./

# Paksa install debug dan library lainnya
RUN npm install debug
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
