const router = require('express').Router()
const c = require('../controllers/memberController')
const { authenticate, authorize } = require('../middlewares/auth')

const ADMIN_ROLES = ['admin', 'super_admin', 'bendahara']
const STAFF_ROLES = ['admin', 'super_admin', 'bendahara']

// Public — statistik landing page (tidak butuh autentikasi)
router.get('/public-stats', c.getPublicStats)

// Semua route butuh login
router.use(authenticate)

// Statistik dashboard — hanya admin/bendahara
router.get('/stats', authorize(...STAFF_ROLES), c.getAdminStats)

// Anggota lihat profil sendiri
router.get('/me', c.getMyProfile)

// Daftar semua anggota — hanya staff
router.get('/', authorize(...STAFF_ROLES), c.getAllMembers)

// Detail satu anggota — hanya staff
router.get('/:id', authorize(...STAFF_ROLES), c.getMemberById)

// Buat anggota baru — hanya admin
router.post('/', authorize(...ADMIN_ROLES), c.createMember)

// Update data anggota — hanya admin
router.put('/:id', authorize(...ADMIN_ROLES), c.updateMember)

// Aktifkan/nonaktifkan — hanya admin
router.patch('/:id/status', authorize(...ADMIN_ROLES), c.setMemberStatus)

// ── Pengunduran diri ────────────────────────────────────────────────────────

// Anggota ajukan pengunduran diri
router.post('/me/resignation', c.submitResignation)

// Bendahara lihat daftar pending
router.get('/resignations/pending', authorize('bendahara', 'admin', 'super_admin'), c.getPendingResignations)

// Bendahara setujui / tolak
router.post('/:id/resignation/review', authorize('bendahara', 'admin', 'super_admin'), c.reviewResignation)

// Anggota ubah rekening sendiri
router.patch('/me/bank-account', c.updateMyBankAccount)

module.exports = router