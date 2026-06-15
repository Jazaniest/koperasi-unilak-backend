const authService = require('../services/authService')
const { ok, fail } = require('../utils/response')

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        return fail(res, 'Email dan kata sandi wajib diisi')
    }

    const result = await authService.login(email, password)
    if (!result.success) {
        return fail(res, result.error, 401)
    }

    return ok(res, { token: result.token, user: result.user }, 'Login berhasil')
}

/**
 * POST /api/auth/logout
 * Stateless JWT — tidak perlu aksi server, cukup konfirmasi ke client.
 */
async function logout(req, res) {
    return ok(res, null, 'Logout berhasil')
}

/**
 * GET /api/auth/me
 * Mengembalikan data user yang sedang login (dari JWT payload)
 */
async function me(req, res) {
    return ok(res, req.user)
}

/**
 * POST /api/auth/change-password
 * Body: { oldPassword, newPassword }
 */
async function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        return fail(res, 'Kata sandi lama dan baru wajib diisi')
    }
    if (newPassword.length < 6) {
        return fail(res, 'Kata sandi baru minimal 6 karakter')
    }
    if (oldPassword === newPassword) {
        return fail(res, 'Kata sandi baru tidak boleh sama dengan yang lama')
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword)
    if (!result.success) {
        return fail(res, result.error)
    }

    return ok(res, null, 'Kata sandi berhasil diubah')
}

/**
 * GET /api/auth/me/member
 * Mengembalikan data member yang terhubung dengan user yang sedang login.
 * Hanya berlaku untuk role 'user'.
 */
async function getMemberProfile(req, res) {
    if (req.user.role !== 'user') {
        return fail(res, 'Akses ditolak', 403)
    }

    const result = await authService.getMemberProfile(req.user.id)
    if (!result.success) {
        return fail(res, result.error, 404)
    }

    return ok(res, result.data)
}

/**
 * PUT /api/auth/me/profile
 * Mengupdate data user (name, phone) dan data member (nik, birth_place_and_date, address, occupation).
 * Hanya berlaku untuk role 'user'.
 * Body: { name, phone, nik, birth_place_and_date, address, occupation }
 */
async function updateProfile(req, res) {
    if (req.user.role !== 'user') {
        return fail(res, 'Akses ditolak', 403)
    }

    const { name, phone, nik, birth_place_and_date, address, occupation } = req.body

    if (!name || name.trim() === '') {
        return fail(res, 'Nama tidak boleh kosong')
    }

    const result = await authService.updateProfile(req.user.id, {
        name: name.trim(),
        phone: phone?.trim() ?? null,
        nik: nik?.trim() ?? null,
        birth_place_and_date: birth_place_and_date?.trim() ?? null,
        address: address?.trim() ?? null,
        occupation: occupation?.trim() ?? null,
    })

    if (!result.success) {
        return fail(res, result.error)
    }

    // ← tambahan: kembalikan data user terbaru
    return ok(res, result.data, 'Profil berhasil diperbarui')
}

module.exports = { login, logout, me, changePassword, getMemberProfile, updateProfile }