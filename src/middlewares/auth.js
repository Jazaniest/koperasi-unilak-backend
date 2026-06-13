const jwt = require('jsonwebtoken')
const { fail } = require('../utils/response')

/**
 * Verifikasi JWT dari header Authorization: Bearer <token>
 * Menyimpan payload ke req.user jika valid
 */
function authenticate(req, res, next) {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return fail(res, 'Token tidak ditemukan', 401)
    }

    const token = header.slice(7)
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        req.user = payload // { id, email, role, name }
        next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return fail(res, 'Token sudah kadaluarsa, silakan login ulang', 401)
        }
        return fail(res, 'Token tidak valid', 401)
    }
}

/**
 * Guard role — pakai setelah authenticate()
 * Contoh: authorize('admin', 'super_admin')
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) return fail(res, 'Tidak terautentikasi', 401)
        if (!roles.includes(req.user.role)) {
            return fail(res, 'Anda tidak memiliki akses ke sumber daya ini', 403)
        }
        next()
    }
}

module.exports = { authenticate, authorize }