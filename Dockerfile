# KITA UPGRADE KE NODE.JS VERSI 20 🚀
FROM node:20-alpine

# Install alat tempur tambahan: Python & FFmpeg
RUN apk add --no-cache python3 ffmpeg

# Set lokasi folder di dalam server
WORKDIR /app

# HILANGKAN TANDA BINTANG: Cuma copy package.json aja biar gak bentrok OS
COPY package.json ./

# PAKSA INSTALL: Pasang modul debug duluan biar yt-dlp gak rewel
RUN npm install debug

# Baru install sisa library lu
RUN npm install

# Copy seluruh file lu ke dalam server
COPY . .

# Buka gerbang komunikasi
EXPOSE 3000

# Perintah untuk menyalakan mesin
CMD ["npm", "start"]