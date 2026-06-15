const { News, User } = require('../models')
const { Op } = require('sequelize')
const { generateId } = require('../utils/generateId')

/**
 * Buat slug dari judul berita
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        + '-' + Date.now()
}

/**
 * GET semua berita (admin: semua status, public: hanya published)
 */
async function getAllNews({ onlyPublished = false, limit = 20, offset = 0 } = {}) {
    const where = onlyPublished ? { is_published: true } : {}

    const { rows, count } = await News.findAndCountAll({
        where,
        order: [['published_at', 'DESC'], ['created_at', 'DESC']],
        limit,
        offset,
        include: [
            {
                model: User,
                as: 'author',
                attributes: ['id', 'name'],
            },
        ],
    })

    return { news: rows, total: count }
}

/**
 * GET satu berita by ID
 */
async function getNewsById(id) {
    const news = await News.findByPk(id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    })
    if (!news) throw Object.assign(new Error('Berita tidak ditemukan'), { status: 404 })
    return news
}

/**
 * GET satu berita by slug (untuk public)
 */
async function getNewsBySlug(slug) {
    const news = await News.findOne({
        where: { slug, is_published: true },
        include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
    })
    if (!news) throw Object.assign(new Error('Berita tidak ditemukan'), { status: 404 })
    return news
}

/**
 * CREATE berita baru
 */
async function createNews({ title, excerpt, content, thumbnail_url, is_published }, userId) {
    const id = generateId('NEWS')
    const slug = slugify(title)
    const published_at = is_published ? new Date() : null

    const news = await News.create({
        id,
        title,
        slug,
        excerpt: excerpt || null,
        content,
        thumbnail_url: thumbnail_url || null,
        is_published: Boolean(is_published),
        published_at,
        created_by: userId,
    })

    return news
}

/**
 * UPDATE berita
 */
async function updateNews(id, { title, excerpt, content, thumbnail_url, is_published }) {
    const news = await News.findByPk(id)
    if (!news) throw Object.assign(new Error('Berita tidak ditemukan'), { status: 404 })

    const wasPublished = news.is_published
    const nowPublished = Boolean(is_published)

    await news.update({
        title: title ?? news.title,
        slug: title ? slugify(title) : news.slug,
        excerpt: excerpt !== undefined ? excerpt : news.excerpt,
        content: content ?? news.content,
        thumbnail_url: thumbnail_url !== undefined ? thumbnail_url : news.thumbnail_url,
        is_published: nowPublished,
        // Set published_at hanya ketika pertama kali dipublish
        published_at: (!wasPublished && nowPublished) ? new Date() : news.published_at,
    })

    return news
}

/**
 * DELETE berita
 */
async function deleteNews(id) {
    const news = await News.findByPk(id)
    if (!news) throw Object.assign(new Error('Berita tidak ditemukan'), { status: 404 })
    await news.destroy()
    return { deleted: true }
}

module.exports = {
    getAllNews,
    getNewsById,
    getNewsBySlug,
    createNews,
    updateNews,
    deleteNews,
}