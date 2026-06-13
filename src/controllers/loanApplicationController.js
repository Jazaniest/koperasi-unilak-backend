const loanApplicationService = require('../services/loanApplicationService')
const memberService = require('../services/memberService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/loan-applications
 * Admin: semua pengajuan, bisa filter ?status=pending
 */
async function getAllApplications(req, res) {
    const { status, memberId } = req.query
    const apps = await loanApplicationService.getLoanApplications({ status, memberId })
    return ok(res, apps)
}

/**
 * GET /api/loan-applications/member/:memberId
 * Pengajuan milik satu anggota
 */
async function getMemberApplications(req, res) {
    const apps = await loanApplicationService.getMemberApplications(req.params.memberId)
    return ok(res, apps)
}

/**
 * POST /api/loan-applications
 * Anggota: ajukan pinjaman baru
 * Body: { amount, purpose, tenorMonths, collateral }
 */
async function submitApplication(req, res) {
    const { amount, purpose, tenorMonths, collateral } = req.body

    if (!amount || !purpose || !tenorMonths) {
        return fail(res, 'Jumlah, tujuan, dan tenor wajib diisi')
    }
    if (Number(amount) <= 0) return fail(res, 'Jumlah pinjaman harus lebih dari 0')
    if (Number(tenorMonths) <= 0) return fail(res, 'Tenor harus lebih dari 0 bulan')

    // Ambil memberId dari profil user yang login
    const member = await memberService.getMemberByUserId(req.user.id)
    if (!member) return fail(res, 'Data anggota tidak ditemukan', 404)
    if (member.status !== 'active') return fail(res, 'Akun anggota tidak aktif', 403)

    const result = await loanApplicationService.submitLoanApplication(member.id, {
        amount,
        purpose,
        tenorMonths,
        collateral,
    })

    if (!result.success) return fail(res, result.error)
    return ok(res, result.application, 'Pengajuan pinjaman berhasil dikirim', 201)
}

/**
 * POST /api/loan-applications/:id/review
 * Admin: setujui atau tolak pengajuan
 * Body: { decision: 'approved' | 'rejected', adminNotes }
 */
async function reviewApplication(req, res) {
    const { decision, adminNotes } = req.body

    if (!decision) return fail(res, 'Keputusan (decision) wajib diisi')

    const result = await loanApplicationService.reviewLoanApplication(
        req.params.id,
        req.user.id,
        decision,
        adminNotes,
    )

    if (!result.success) return fail(res, result.error)
    return ok(res, result.loan ?? null, `Pengajuan berhasil ${decision === 'approved' ? 'disetujui' : 'ditolak'}`)
}

module.exports = {
    getAllApplications,
    getMemberApplications,
    submitApplication,
    reviewApplication,
}