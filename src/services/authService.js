const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, Member, SystemLog } = require('../models')
const { generateId } = require('../utils/generateId')

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

/**
 * Login — cari user by email, bandingkan password, return JWT
 */
async function login(email, password) {
    const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [{ model: Member, as: 'member', attributes: ['id', 'memberNumber', 'status'] }],
    })

    
    if (!user) {
        return { success: false, error: 'Email atau kata sandi salah' }
    }
    
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        console.log('Password FE:', password)
        console.log('Password BE:', user.password)
        return { success: false, error: 'Email atau kata sandi salah' }
    }
    

    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Login: ${user.email} (${user.role})`,
    })

    // Jangan kembalikan password ke client
    const { password: _, ...safeUser } = user.toJSON()

    return { success: true, token, user: safeUser }
}

/**
 * Change password — verifikasi password lama sebelum update
 */
async function changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId)
    if (!user) {
        return { success: false, error: 'User tidak ditemukan' }
    }

    const match = await bcrypt.compare(oldPassword, user.password)
    if (!match) {
        return { success: false, error: 'Kata sandi lama tidak sesuai' }
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await user.update({ password: hashed })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Ganti password: ${user.email}`,
    })

    return { success: true }
}

/**
 * Hash password — dipakai saat seed / buat user baru
 */
async function hashPassword(plain) {
    return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

module.exports = { login, changePassword, hashPassword }