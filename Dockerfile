FROM node:20-alpine

# Install Python & FFmpeg
RUN apk add --no-cache python3 ffmpeg

# Bikin folder app & temp dengan izin akses penuh (Syarat Hugging Face)
RUN mkdir -p /app/temp && chmod 777 /app/temp
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Hugging Face WAJIB pakai port 7860
EXPOSE 7860
ENV PORT=7860

CMD ["npm", "start"]
