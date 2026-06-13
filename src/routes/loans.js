const router = require('express').Router()
const c = require('../controllers/loanController')
const { authenticate, authorize } = require('../middlewares/auth')

const STAFF_ROLES = ['admin', 'super_admin', 'bendahara']

router.use(authenticate)

// Semua pinjaman (dengan filter opsional) — staff
router.get('/', authorize(...STAFF_ROLES), c.getAllLoans)

// Pinjaman per anggota — staff atau anggota sendiri
router.get('/member/:memberId', c.getMemberLoans)

// Detail pinjaman — staff
router.get('/:id', authorize(...STAFF_ROLES), c.getLoanDetail)

// Riwayat pembayaran — staff
router.get('/:id/payments', authorize(...STAFF_ROLES), c.getLoanPayments)

// Catat cicilan — bendahara/admin
router.post('/:id/pay', authorize(...STAFF_ROLES), c.recordPayment)

// Pelunasan sekaligus — bendahara/admin
router.post('/:id/settle', authorize(...STAFF_ROLES), c.settleLoan)

module.exports = router