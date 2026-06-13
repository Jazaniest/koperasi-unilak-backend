const router = require('express').Router()
const registrationController = require('../controllers/registrationController')
const { authenticate, authorize } = require('../middlewares/auth')

// ── Public ────────────────────────────────────────────────────────────────────
// Calon anggota mengajukan pendaftaran
router.post('/', registrationController.submitRequest)

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(authenticate, authorize('admin', 'super_admin'))

// Jumlah pending (untuk badge notifikasi di navbar)
router.get('/pending-count', registrationController.getPendingCount)

// Daftar semua permintaan (GET /api/registrations?status=pending)
router.get('/', registrationController.getAllRequests)

// Detail satu permintaan
router.get('/:id', registrationController.getRequestById)

// Approve
router.post('/:id/approve', registrationController.approveRequest)

// Reject
router.post('/:id/reject', registrationController.rejectRequest)

module.exports = router