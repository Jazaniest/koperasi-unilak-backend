const router = require('express').Router()
const c = require('../controllers/systemController')
const { authenticate, authorize } = require('../middlewares/auth')

const STAFF_ROLES      = ['admin', 'super_admin', 'bendahara']
const ADMIN_ROLES      = ['admin', 'super_admin', 'bendahara']
const SUPER_ADMIN_ONLY = ['super_admin']

router.use(authenticate)

// Logs — staff bisa lihat, hanya super_admin yang bisa hapus
router.get('/logs',    authorize(...STAFF_ROLES),      c.getLogs)
router.delete('/logs', authorize(...SUPER_ADMIN_ONLY), c.clearLogs)

// Metrik & stats DB — admin ke atas
router.get('/metrics',  authorize(...ADMIN_ROLES), c.getMetrics)
router.get('/db-stats', authorize(...ADMIN_ROLES), c.getDbStats)

// Export backup — super_admin only
router.get('/export', authorize(...SUPER_ADMIN_ONLY), c.exportDatabase)

module.exports = router