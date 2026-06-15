const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Pastikan kedua folder ada saat server start
const collateralDir = path.join(__dirname, '../uploads/collateral')
const newsDir = path.join(__dirname, '../uploads/news')
if (!fs.existsSync(collateralDir)) fs.mkdirSync(collateralDir, { recursive: true })
if (!fs.existsSync(newsDir)) fs.mkdirSync(newsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Tentukan folder berdasarkan route yang dipanggil
        const isNews = req.path.includes('news') || req.baseUrl.includes('news')
        const folder = isNews ? newsDir : collateralDir
        cb(null, folder)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const isNews = req.path.includes('news') || req.baseUrl.includes('news')
        const prefix = isNews ? 'news' : 'collateral'
        const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
        cb(null, name)
    },
})

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('File harus berupa PDF, JPG, atau PNG'))
}

module.exports = {
    upload: multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }),
}