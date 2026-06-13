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
 * Token di-invalidate di sisi client dengan menghapus dari storage.
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
 * Hanya bisa mengubah password sendiri
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

module.exports = { login, logout, me, changePassword }