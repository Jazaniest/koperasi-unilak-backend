const memberService = require('../services/memberService')
const { hashPassword } = require('../services/authService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/members
 * Admin/bendahara: semua anggota
 * User biasa: redirect ke /api/members/me
 */
async function getAllMembers(req, res) {
    const members = await memberService.getAllMembers()
    return ok(res, members)
}

/**
 * GET /api/members/stats
 * Statistik ringkasan untuk dashboard admin
 */
async function getAdminStats(req, res) {
    const stats = await memberService.getAdminStats()
    return ok(res, stats)
}

/**
 * GET /api/members/me
 * Anggota mengambil data dirinya sendiri
 */
async function getMyProfile(req, res) {
    const member = await memberService.getMemberByUserId(req.user.id)
    if (!member) return fail(res, 'Data anggota tidak ditemukan', 404)
    return ok(res, member)
}

/**
 * GET /api/members/:id
 * Admin/bendahara: ambil detail satu anggota
 */
async function getMemberById(req, res) {
    const member = await memberService.getMemberById(req.params.id)
    if (!member) return fail(res, 'Anggota tidak ditemukan', 404)
    return ok(res, member)
}

/**
 * POST /api/members
 * Admin/super_admin: daftarkan anggota baru
 * Body: { name, email, password, phone, nik, address, birthPlaceAndDate, occupation, monthlyIncome }
 */
async function createMember(req, res) {
    const { name, email, password, ...rest } = req.body

    if (!name || !email || !password) {
        return fail(res, 'Nama, email, dan kata sandi wajib diisi')
    }
    if (password.length < 6) {
        return fail(res, 'Kata sandi minimal 6 karakter')
    }

    const hashed = await hashPassword(password)
    const result = await memberService.createMember({ name, email, ...rest }, hashed)

    if (!result.success) return fail(res, result.error)
    return ok(res, result.member, 'Anggota berhasil didaftarkan', 201)
}

/**
 * PUT /api/members/:id
 * Admin/super_admin: update data anggota
 */
async function updateMember(req, res) {
    const result = await memberService.updateMember(req.params.id, req.body)
    if (!result.success) return fail(res, result.error, 404)
    return ok(res, null, 'Data anggota berhasil diperbarui')
}

/**
 * PATCH /api/members/:id/status
 * Admin/super_admin: aktifkan atau nonaktifkan anggota
 * Body: { status: 'active' | 'inactive' }
 */
async function setMemberStatus(req, res) {
    const { status } = req.body
    if (!['active', 'inactive'].includes(status)) {
        return fail(res, 'Status tidak valid, gunakan "active" atau "inactive"')
    }

    const result = await memberService.setMemberStatus(req.params.id, status)
    if (!result.success) return fail(res, result.error, 404)
    return ok(res, null, `Anggota berhasil di-${status === 'active' ? 'aktifkan' : 'nonaktifkan'}`)
}

/**
 * PATCH /api/members/me/bank-account
 * Anggota mengubah nama bank & nomor rekening miliknya sendiri
 * Body: { bankName, bankAccountNumber }
 */
async function updateMyBankAccount(req, res) {
    const { bankName, bankAccountNumber } = req.body

    if (!bankName || !bankAccountNumber) {
        return fail(res, 'Nama bank dan nomor rekening wajib diisi')
    }

    const member = await memberService.getMemberByUserId(req.user.id)
    if (!member) return fail(res, 'Data anggota tidak ditemukan', 404)

    const result = await memberService.updateBankAccount(member.id, { bankName, bankAccountNumber })
    if (!result.success) return fail(res, result.error)
    return ok(res, result.member, 'Rekening berhasil diperbarui')
}

/**
 * POST /api/members/me/resignation
 * Anggota mengajukan pengunduran diri
 * Body: { reason }
 */
async function submitResignation(req, res) {
    const member = await memberService.getMemberByUserId(req.user.id)
    if (!member) return fail(res, 'Data anggota tidak ditemukan', 404)

    const { reason } = req.body
    const result = await memberService.submitResignation(member.id, reason)
    if (!result.success) return fail(res, result.error)
    return ok(res, null, 'Pengajuan pengunduran diri berhasil dikirim')
}

/**
 * POST /api/members/:id/resignation/review
 * Bendahara: setujui atau tolak pengunduran diri
 * Body: { decision: 'approved' | 'rejected', notes }
 */
async function reviewResignation(req, res) {
    const { decision, notes } = req.body
    if (!decision) return fail(res, 'decision wajib diisi')

    const result = await memberService.reviewResignation(
        req.params.id,
        req.user.id,
        decision,
        notes,
    )
    if (!result.success) return fail(res, result.error)

    const msg = decision === 'approved'
        ? 'Pengunduran diri disetujui, akun anggota dinonaktifkan'
        : 'Pengajuan pengunduran diri ditolak'
    return ok(res, null, msg)
}

/**
 * GET /api/members/resignations/pending
 * Bendahara: daftar pengajuan pengunduran diri
 */
async function getPendingResignations(req, res) {
    const list = await memberService.getPendingResignations()
    return ok(res, list)
}

/**
 * GET /api/members/public-stats
 * Public — statistik ringkasan untuk landing page (tanpa data sensitif)
 */
async function getPublicStats(req, res) {
    const stats = await memberService.getAdminStats()
    // Hanya expose field yang aman untuk publik
    return ok(res, {
        totalMembers: stats.totalMembers,
        activeMembers: stats.activeMembers,
        totalSavings: stats.totalSavings,
        totalLoans: stats.totalLoans,
    })
}

module.exports = {
    getAllMembers,
    getAdminStats,
    getMyProfile,
    getMemberById,
    createMember,
    updateMember,
    setMemberStatus,
    updateMyBankAccount,
    submitResignation,
    reviewResignation,
    getPendingResignations,
    getPublicStats,
}