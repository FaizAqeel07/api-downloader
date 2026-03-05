const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// ZONA 1: SECURITY & INFRASTRUCTURE
// ==========================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiter: Maksimal 20 request per 10 menit dari 1 IP (Anti-DDoS / Spam)
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 20, 
    message: { success: false, message: 'Terlalu banyak request! Sabar bos, tunggu 10 menit lagi.' }
});
app.use('/api/', apiLimiter);

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Simple In-Memory Cache dengan batas maksimal (Fix Memori Jebol/OOM)
const metaCache = new Map();
const MAX_CACHE_SIZE = 100;

// ==========================================
// ZONA 2: AUTOMATION (GARBAGE COLLECTOR)
// ==========================================
// Patroli setiap 15 menit untuk menghapus file hantu/sampah
setInterval(() => {
    fs.readdir(tempDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                // Jika file umurnya lebih dari 30 menit, basmi!
                if (now - stats.mtimeMs > 30 * 60 * 1000) {
                    fs.unlink(filePath, () => console.log(` [SISTEM] Membersihkan file usang: ${file}`));
                }
            });
        });
    });
}, 15 * 60 * 1000); 

const isValidUrl = (string) => {
    try { new URL(string); return true; } catch (_) { return false; }
};

// ==========================================
// ZONA 3: CORE API (BUSINESS LOGIC)
// ==========================================

app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url || !isValidUrl(url)) return res.status(400).json({ success: false, message: 'URL tidak valid!' });

    if (metaCache.has(url)) {
        console.log(` [CACHE HIT] Mengambil info dari memori untuk: ${url}`);
        return res.status(200).json(metaCache.get(url));
    }

    console.log(`\n [SISTEM] Meretas info baru dari: ${url}`);
    try {
        const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true, noCheckCertificates: true });
        
        const responseData = {
            success: true,
            data: {
                title: info.title,
                thumbnail: info.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image',
                platform: info.extractor_key
            }
        };

        // Manajemen Cache Aman: Hapus yang paling lama kalau udah kepenuhan
        if (metaCache.size >= MAX_CACHE_SIZE) {
            const firstKey = metaCache.keys().next().value;
            metaCache.delete(firstKey);
        }
        metaCache.set(url, responseData);
        setTimeout(() => metaCache.delete(url), 60 * 60 * 1000); // Expired dalam 1 jam

        console.log(` [INFO] Berhasil meretas: ${info.title.substring(0, 30)}...`);
        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal meretas data. Link di-private atau salah.' });
    }
});

app.get('/api/download', async (req, res) => {
    const { url, quality = 'hd', title = 'Video_Media' } = req.query;
    if (!url || !isValidUrl(url)) return res.status(400).send('URL hilang.');

    // Sanitasi ekstra di Backend untuk nama file
    const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 30).replace(/\s+/g, '_');
    const finalFileName = `${cleanTitle}_${quality.toUpperCase()}.mp4`;
    const filePath = path.join(tempDir, `temp_${Date.now()}.mp4`);

    console.log(`\n [DOWNLOAD] Memproses: ${finalFileName}`);

    try {
        let formatOpt = quality === 'sd' ? 'best[height<=480][ext=mp4]/best' : 'best[ext=mp4]/best';
        await youtubedl(url, { output: filePath, format: formatOpt, noWarnings: true });

        console.log(` [BERHASIL] File siap dikirim.`);
        res.download(filePath, finalFileName, () => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
        });
    } catch (error) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).send('Gagal mengunduh video dari pusat.');
    }
});

// ==========================================
// ZONA 4: SERVER IGNITION
// ==========================================
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(` Sistem Siap di Port ${PORT} (Anti-DDoS Aktif)`);
    console.log(` Buka di browser: http://localhost:${PORT}`);
    console.log(`=================================`);
});