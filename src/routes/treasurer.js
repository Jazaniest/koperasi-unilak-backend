const router = require('express').Router()
const c = require('../controllers/treasurerController')
const { authenticate, authorize } = require('../middlewares/auth')

const STAFF_ROLES  = ['admin', 'super_admin', 'bendahara']
const ADMIN_ROLES  = ['admin', 'super_admin', 'bendahara']

router.use(authenticate)

// Ringkasan keuangan — staff
router.get('/stats', authorize(...STAFF_ROLES), c.getStats)

// Laporan bulanan — staff
router.get('/report/monthly',     authorize(...STAFF_ROLES), c.getMonthlyReport)
router.get('/report/last6months', authorize(...STAFF_ROLES), c.getLast6MonthsReport)

// Proses manual — hanya admin (operasi destructive)
router.post('/process/cicilan',        authorize(...ADMIN_ROLES), c.processCicilan)
router.post('/process/simpanan-wajib', authorize(...ADMIN_ROLES), c.processSimpananWajib)

module.exports = router