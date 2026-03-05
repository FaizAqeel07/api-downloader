# Pakai mesin Linux ringan berbasis Node.js
FROM node:18-alpine

# Install alat tempur tambahan: Python & FFmpeg (Biar yt-dlp makin sakti)
RUN apk add --no-cache python3 ffmpeg

# Set lokasi folder di dalam server
WORKDIR /app

# Copy daftar library lu
COPY package*.json ./

# Install semua library (express, youtube-dl-exec, dll)
RUN npm install

# Copy seluruh file lu ke dalam server
COPY . .

# Buka gerbang komunikasi di port 3000
EXPOSE 3000

# Perintah untuk menyalakan mesin
CMD ["npm", "start"]