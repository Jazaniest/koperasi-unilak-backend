const router = require('express').Router()
const c = require('../controllers/loanApplicationController')
const { authenticate, authorize } = require('../middlewares/auth')

const ADMIN_ROLES = ['admin', 'super_admin', 'bendahara']
const STAFF_ROLES = ['admin', 'super_admin', 'bendahara', 'user']

router.use(authenticate)

// Semua pengajuan (filter ?status=pending) — staff
router.get('/', authorize(...STAFF_ROLES), c.getAllApplications)

// Pengajuan per anggota — staff atau anggota sendiri
router.get('/member/:memberId', c.getMemberApplications)

// Ajukan pinjaman baru — anggota (role: user)
router.post('/loan', authorize('user'), c.submitApplication)

// Review pengajuan (approve/reject) — admin
router.post('/:id/review', authorize(...ADMIN_ROLES), c.reviewApplication)

module.exports = router