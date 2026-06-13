const registrationService = require('../services/registrationService')
const { ok, fail } = require('../utils/response')

/**
 * POST /api/registrations
 * Public — calon anggota mengajukan pendaftaran
 */
async function submitRequest(req, res) {
    const { name, email, password, phone, nik, address, birthPlaceAndDate, occupation, monthlyIncome } = req.body

    if (!name || !email || !password) {
        return fail(res, 'Nama, email, dan kata sandi wajib diisi')
    }
    if (password.length < 6) {
        return fail(res, 'Kata sandi minimal 6 karakter')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return fail(res, 'Format email tidak valid')
    }

    const result = await registrationService.submitRequest({
        name, email, password, phone, nik, address, birthPlaceAndDate, occupation, monthlyIncome,
    })

    if (!result.success) return fail(res, result.error)
    return ok(res, result.request, 'Permintaan pendaftaran berhasil dikirim. Silakan tunggu persetujuan admin.', 201)
}

/**
 * GET /api/registrations
 * Admin — daftar semua permintaan pendaftaran
 * Query: ?status=pending|approved|rejected
 */
async function getAllRequests(req, res) {
    const { status } = req.query
    const validStatuses = ['pending', 'approved', 'rejected']

    if (status && !validStatuses.includes(status)) {
        return fail(res, 'Status tidak valid')
    }

    const requests = await registrationService.getAllRequests(status || null)
    return ok(res, requests)
}

/**
 * GET /api/registrations/:id
 * Admin — detail satu permintaan
 */
async function getRequestById(req, res) {
    const request = await registrationService.getRequestById(req.params.id)
    if (!request) return fail(res, 'Permintaan tidak ditemukan', 404)
    return ok(res, request)
}

/**
 * POST /api/registrations/:id/approve
 * Admin — setujui permintaan
 * Body: { note } (opsional)
 */
async function approveRequest(req, res) {
    const { note } = req.body
    const result = await registrationService.approveRequest(req.params.id, req.user.id, note || null)

    if (!result.success) return fail(res, result.error)
    return ok(res, result.member, 'Permintaan pendaftaran berhasil disetujui')
}

/**
 * POST /api/registrations/:id/reject
 * Admin — tolak permintaan
 * Body: { note } (opsional tapi disarankan diisi)
 */
async function rejectRequest(req, res) {
    const { note } = req.body
    const result = await registrationService.rejectRequest(req.params.id, req.user.id, note || null)

    if (!result.success) return fail(res, result.error)
    return ok(res, null, 'Permintaan pendaftaran ditolak')
}

/**
 * GET /api/registrations/pending-count
 * Admin — jumlah request pending untuk notifikasi
 */
async function getPendingCount(req, res) {
    const count = await registrationService.countPendingRequests()
    return ok(res, { count })
}

module.exports = {
    submitRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    getPendingCount,
}