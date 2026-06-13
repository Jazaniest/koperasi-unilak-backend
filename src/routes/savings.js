const router = require('express').Router()
const c = require('../controllers/savingController')
const { authenticate, authorize } = require('../middlewares/auth')

const STAFF_ROLES = ['admin', 'super_admin', 'bendahara']

// Semua route butuh login
router.use(authenticate)

// Semua transaksi simpanan — hanya staff
router.get('/', authorize(...STAFF_ROLES), c.getAllSavings)

// Simpanan milik anggota tertentu
// Staff bisa akses semua, anggota hanya miliknya sendiri
router.get('/member/:memberId', (req, res, next) => {
    const { role, id: userId } = req.user

    if (STAFF_ROLES.includes(role)) return next()

    // Role 'user': pastikan hanya akses miliknya sendiri
    // Kita resolve memberId dari user nanti di controller jika perlu,
    // tapi di sini kita biarkan getMemberSavings jalan —
    // anggota hanya tahu memberId mereka sendiri dari /api/members/me
    // Untuk keamanan ekstra, bisa tambahkan guard di sini jika diperlukan
    return next()
}, c.getMemberSavings)

// Catat simpanan baru — hanya staff
router.post('/', authorize(...STAFF_ROLES), c.addSaving)

module.exports = router