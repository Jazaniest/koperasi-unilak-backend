const router = require('express').Router()
const c = require('../controllers/newsController')
const { authenticate, authorize } = require('../middlewares/auth')
const { upload } = require('../middlewares/upload') // multer middleware yang sudah ada

// ── Public (tidak perlu login) ────────────────────────────────────────────────
router.get('/', c.getPublicNews)
router.get('/slug/:slug', c.getPublicNewsBySlug)

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(authenticate)

router.get('/admin', authorize('admin', 'super_admin'), c.getAllNewsAdmin)
router.get('/admin/:id', authorize('admin', 'super_admin'), c.getNewsById)
router.post('/', authorize('admin', 'super_admin'), c.createNews)
router.put('/:id', authorize('admin', 'super_admin'), c.updateNews)
router.delete('/:id', authorize('admin', 'super_admin'), c.deleteNews)

// Upload thumbnail — gunakan field 'thumbnail' dari form-data
router.post(
    '/upload-thumbnail',
    authorize('admin', 'super_admin'),
    upload.single('thumbnail'),
    c.uploadThumbnail
)

module.exports = router