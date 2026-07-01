const loanService = require('../services/loanService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/loans
 * Admin/bendahara: semua pinjaman, bisa filter ?status=active&memberId=m-001
 */
async function getAllLoans(req, res) {
    const { status, memberId } = req.query
    const loans = await loanService.getAllLoans({ status, memberId })
    return ok(res, loans)
}

/**
 * GET /api/loans/member/:memberId
 * Pinjaman milik satu anggota
 * Anggota hanya bisa akses miliknya sendiri (dijaga di route)
 */
async function getMemberLoans(req, res) {
    const loans = await loanService.getMemberLoans(req.params.memberId)
    return ok(res, loans)
}

/**
 * GET /api/loans/:id
 * Detail pinjaman + riwayat pembayaran
 */
async function getLoanDetail(req, res) {
    const loan = await loanService.getLoanDetail(req.params.id)
    if (!loan) return fail(res, 'Pinjaman tidak ditemukan', 404)
    return ok(res, loan)
}

/**
 * GET /api/loans/:id/installments
 * Jadwal cicilan dinamis untuk satu pinjaman
 */
async function getLoanInstallments(req, res) {
    const schedule = await loanService.getLoanInstallmentSchedule(req.params.id)
    if (!schedule) return fail(res, 'Pinjaman tidak ditemukan', 404)
    return ok(res, schedule)
}


/**
 * GET /api/loans/:id/payments
 * Riwayat pembayaran satu pinjaman
 */
async function getLoanPayments(req, res) {
    const payments = await loanService.getLoanPayments(req.params.id)
    return ok(res, payments)
}

/**
 * POST /api/loans/:id/pay
 * Bendahara: catat pembayaran cicilan
 * Body: { amount, description }
 */
async function recordPayment(req, res) {
    const { amount, description } = req.body

    if (!amount) return fail(res, 'Jumlah pembayaran wajib diisi')

    const result = await loanService.recordLoanPayment({
        loanId: req.params.id,
        amount,
        description,
    })

    if (!result.success) return fail(res, result.error)
    return ok(res, result, 'Pembayaran cicilan berhasil dicatat')
}

/**
 * POST /api/loans/:id/settle
 * Bendahara/admin: lunasi pinjaman sekaligus
 */
async function settleLoan(req, res) {
    const result = await loanService.settleLoan(req.params.id, req.user.id)
    if (!result.success) return fail(res, result.error)
    return ok(res, null, 'Pinjaman berhasil dilunasi')
}

module.exports = {
    getAllLoans,
    getMemberLoans,
    getLoanDetail,
    getLoanPayments,
    recordPayment,
    settleLoan,
    getLoanInstallments, // Export fungsi baru
}
