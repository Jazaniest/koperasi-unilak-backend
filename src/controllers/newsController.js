const newsService = require('../services/newsService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/news
 * Public — hanya berita yang sudah published
 */
async function getPublicNews(req, res) {
    const limit = parseInt(req.query.limit ?? 6, 10)
    const offset = parseInt(req.query.offset ?? 0, 10)
    const result = await newsService.getAllNews({ onlyPublished: true, limit, offset })
    return ok(res, result)
}

/**
 * GET /api/news/slug/:slug
 * Public — detail berita by slug
 */
async function getPublicNewsBySlug(req, res) {
    const news = await newsService.getNewsBySlug(req.params.slug)
    return ok(res, news)
}

/**
 * GET /api/news/admin
 * Admin — semua berita (termasuk draft)
 */
async function getAllNewsAdmin(req, res) {
    const limit = parseInt(req.query.limit ?? 20, 10)
    const offset = parseInt(req.query.offset ?? 0, 10)
    const result = await newsService.getAllNews({ onlyPublished: false, limit, offset })
    return ok(res, result)
}

/**
 * GET /api/news/admin/:id
 * Admin — detail by ID
 */
async function getNewsById(req, res) {
    const news = await newsService.getNewsById(req.params.id)
    return ok(res, news)
}

/**
 * POST /api/news
 * Admin only — buat berita baru
 */
async function createNews(req, res) {
    const { title, excerpt, content, thumbnail_url, is_published } = req.body

    if (!title || !content) {
        return fail(res, 'Judul dan konten wajib diisi', 400)
    }

    const news = await newsService.createNews(
        { title, excerpt, content, thumbnail_url, is_published },
        req.user.id
    )
    return ok(res, news, 'Berita berhasil dibuat', 201)
}

/**
 * PUT /api/news/:id
 * Admin only — update berita
 */
async function updateNews(req, res) {
    const { title, excerpt, content, thumbnail_url, is_published } = req.body
    const news = await newsService.updateNews(req.params.id, {
        title, excerpt, content, thumbnail_url, is_published,
    })
    return ok(res, news, 'Berita berhasil diperbarui')
}

/**
 * DELETE /api/news/:id
 * Admin only — hapus berita
 */
async function deleteNews(req, res) {
    const result = await newsService.deleteNews(req.params.id)
    return ok(res, result, 'Berita berhasil dihapus')
}

/**
 * POST /api/news/upload-thumbnail
 * Admin only — upload gambar thumbnail, return URL
 */
async function uploadThumbnail(req, res) {
    if (!req.file) return fail(res, 'File tidak ditemukan', 400)
    const url = `/uploads/news/${req.file.filename}`
    return ok(res, { url }, 'Thumbnail berhasil diupload')
}

module.exports = {
    getPublicNews,
    getPublicNewsBySlug,
    getAllNewsAdmin,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    uploadThumbnail,
}