const router = require('express').Router()
const c = require('../controllers/loanController')
const { authenticate, authorize } = require('../middlewares/auth')

const STAFF_ROLES = ['admin', 'super_admin', 'bendahara']

router.use(authenticate)

// Semua pinjaman (dengan filter opsional) — staff
router.get('/', authorize(...STAFF_ROLES), c.getAllLoans)

// Pinjaman per anggota — staff atau anggota sendiri
router.get('/member/:memberId', c.getMemberLoans)

// Detail pinjaman — staff atau anggota sendiri (logika di controller)
router.get('/:id', c.getLoanDetail)

// Jadwal cicilan — staff atau anggota sendiri (logika di controller)
router.get('/:id/installments', c.getLoanInstallments)

// Riwayat pembayaran — staff
router.get('/:id/payments', authorize(...STAFF_ROLES), c.getLoanPayments)

// Catat cicilan — bendahara/admin
router.post('/:id/pay', authorize(...STAFF_ROLES), c.recordPayment)

// Pelunasan sekaligus — bendahara/admin
router.post('/:id/settle', authorize(...STA_FF_ROLES), c.settleLoan)

module.exports = router
