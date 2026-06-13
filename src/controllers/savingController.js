const savingService = require('../services/savingService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/savings
 * Bendahara/admin: semua transaksi simpanan
 */
async function getAllSavings(req, res) {
    const savings = await savingService.getAllSavingsTransactions()
    return ok(res, savings)
}

/**
 * GET /api/savings/member/:memberId
 * Ambil simpanan milik satu anggota + summary per tipe
 * Admin/bendahara bisa akses semua, anggota hanya miliknya sendiri (dijaga di route)
 */
async function getMemberSavings(req, res) {
    const data = await savingService.getMemberSavings(req.params.memberId)
    return ok(res, data)
}

/**
 * POST /api/savings
 * Bendahara/admin: catat transaksi simpanan
 * Body: { memberId, type, amount, description }
 */
async function addSaving(req, res) {
    const { memberId, type, amount, description } = req.body

    if (!memberId || !type || !amount) {
        return fail(res, 'memberId, type, dan amount wajib diisi')
    }
    if (Number(amount) <= 0) {
        return fail(res, 'Jumlah simpanan harus lebih dari 0')
    }

    const result = await savingService.addSavingsTransaction({ memberId, type, amount, description })
    if (!result.success) return fail(res, result.error)
    return ok(res, result.saving, 'Simpanan berhasil dicatat', 201)
}

module.exports = { getAllSavings, getMemberSavings, addSaving }