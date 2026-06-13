const { Op } = require('sequelize')
const { RegistrationRequest, User, Member, SystemLog } = require('../models')
const { generateId } = require('../utils/generateId')
const { hashPassword } = require('./authService')
const memberService = require('./memberService')

/**
 * Ajukan permintaan pendaftaran baru.
 * Password di-hash di sini sebelum disimpan.
 */
async function submitRequest(data) {
    const { name, email, password, phone, nik, address, birthPlaceAndDate, occupation, monthlyIncome } = data

    // Cek email sudah terdaftar sebagai user aktif
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } })
    if (existingUser) {
        return { success: false, error: 'Email sudah terdaftar' }
    }

    // Cek email sudah ada di pending request
    const existingRequest = await RegistrationRequest.findOne({
        where: { email: email.toLowerCase(), status: 'pending' },
    })
    if (existingRequest) {
        return { success: false, error: 'Permintaan pendaftaran dengan email ini sedang menunggu persetujuan' }
    }

    const passwordHash = await hashPassword(password)

    const request = await RegistrationRequest.create({
        id: generateId('reg'),
        name,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        nik: nik || null,
        address: address || null,
        birthPlaceAndDate: birthPlaceAndDate || null,
        occupation: occupation || null,
        monthlyIncome: monthlyIncome || null,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Permintaan pendaftaran baru: ${email}`,
    })

    const { passwordHash: _, ...safeRequest } = request.toJSON()
    return { success: true, request: safeRequest }
}

/**
 * Ambil semua permintaan pendaftaran (untuk admin).
 * Bisa difilter by status.
 */
async function getAllRequests(status = null) {
    const where = status ? { status } : {}

    const requests = await RegistrationRequest.findAll({
        where,
        attributes: { exclude: ['passwordHash'] },
        order: [['createdAt', 'DESC']],
    })

    return requests.map((r) => r.toJSON())
}

/**
 * Ambil satu permintaan by ID.
 */
async function getRequestById(id) {
    const request = await RegistrationRequest.findByPk(id, {
        attributes: { exclude: ['passwordHash'] },
    })
    return request ? request.toJSON() : null
}

/**
 * Admin menyetujui permintaan pendaftaran.
 * Otomatis membuat User + Member baru.
 */
async function approveRequest(requestId, adminUserId, note = null) {
    const request = await RegistrationRequest.findByPk(requestId)
    if (!request) return { success: false, error: 'Permintaan tidak ditemukan' }
    if (request.status !== 'pending') {
        return { success: false, error: 'Permintaan ini sudah diproses sebelumnya' }
    }

    // Cek email belum dipakai (bisa saja ada race condition)
    const existingUser = await User.findOne({ where: { email: request.email } })
    if (existingUser) {
        await request.update({ status: 'rejected', reviewedBy: adminUserId, reviewedAt: new Date(), reviewNote: 'Email sudah terdaftar di sistem' })
        return { success: false, error: 'Email sudah terdaftar, permintaan otomatis ditolak' }
    }

    // Buat user + member via memberService yang sudah ada
    const result = await memberService.createMember(
        {
            name: request.name,
            email: request.email,
            phone: request.phone,
            nik: request.nik,
            address: request.address,
            birthPlaceAndDate: request.birthPlaceAndDate,
            occupation: request.occupation,
            monthlyIncome: request.monthlyIncome,
        },
        request.passwordHash, // sudah di-hash, langsung pakai
    )

    if (!result.success) return { success: false, error: result.error }

    await request.update({
        status: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNote: note,
        createdUserId: result.member.userId,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pendaftaran disetujui: ${request.email} oleh admin ${adminUserId}`,
    })

    return { success: true, member: result.member }
}

/**
 * Admin menolak permintaan pendaftaran.
 */
async function rejectRequest(requestId, adminUserId, note = null) {
    const request = await RegistrationRequest.findByPk(requestId)
    if (!request) return { success: false, error: 'Permintaan tidak ditemukan' }
    if (request.status !== 'pending') {
        return { success: false, error: 'Permintaan ini sudah diproses sebelumnya' }
    }

    await request.update({
        status: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        reviewNote: note,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pendaftaran ditolak: ${request.email} oleh admin ${adminUserId}`,
    })

    return { success: true }
}

/**
 * Hitung jumlah request pending (untuk badge notifikasi di admin).
 */
async function countPendingRequests() {
    return RegistrationRequest.count({ where: { status: 'pending' } })
}

module.exports = {
    submitRequest,
    getAllRequests,
    getRequestById,
    approveRequest,
    rejectRequest,
    countPendingRequests,
}