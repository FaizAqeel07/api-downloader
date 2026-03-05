# KITA UPGRADE KE NODE.JS VERSI 20 🚀
FROM node:20-alpine

# Install alat tempur tambahan: Python & FFmpeg
RUN apk add --no-cache python3 ffmpeg

# Set lokasi folder di dalam server
WORKDIR /app

# Copy daftar library lu
COPY package*.json ./

# Install semua library
RUN npm install

# Copy seluruh file lu ke dalam server
COPY . .

# Buka gerbang komunikasi
EXPOSE 3000

# Perintah untuk menyalakan mesin
CMD ["npm", "start"]