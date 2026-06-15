const router = require('express').Router()
const c = require('../controllers/loanApplicationController')
const { authenticate, authorize } = require('../middlewares/auth')
const { upload } = require('../middlewares/upload')

const ADMIN_ROLES = ['admin', 'super_admin', 'bendahara']
const STAFF_ROLES = ['admin', 'super_admin', 'bendahara', 'user']

router.use(authenticate)

// Semua pengajuan (filter ?status=pending) — staff
router.get('/', authorize(...STAFF_ROLES), c.getAllApplications)

// Pengajuan per anggota — staff atau anggota sendiri
router.get('/member/:memberId', c.getMemberApplications)

// Ajukan pinjaman baru — anggota (role: user)
router.post('/loan', authorize('user'), upload.single('collateral'), c.submitApplication)

// Ajukan top up — anggota
router.post('/topup', authorize('user'), upload.single('collateral'), c.submitTopUp)

// Review top up — bendahara/admin
router.post('/:id/review-topup', authorize(...ADMIN_ROLES), c.reviewTopUp)

// Review pengajuan (approve/reject) — admin
router.post('/:id/review', authorize(...ADMIN_ROLES), c.reviewApplication)

module.exports = router