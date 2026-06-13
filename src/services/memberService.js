const { Op } = require('sequelize')
const { User, Member, Saving, Loan, LoanApplication } = require('../models')
const { generateId } = require('../utils/generateId')

// ── Atribut yang aman dikembalikan ke client ──────────────────────────────────
const USER_SAFE_ATTRS = ['id', 'name', 'email', 'phone', 'role']

/**
 * Ambil semua anggota beserta ringkasan simpanan & pinjaman
 */
async function getAllMembers() {
    const members = await Member.findAll({
        include: [
            { model: User, as: 'user', attributes: USER_SAFE_ATTRS },
            { model: Saving, as: 'savings', attributes: ['type', 'amount'] },
            {
                model: Loan, as: 'loans',
                attributes: ['id', 'status', 'remaining'],
            },
            {
                model: LoanApplication, as: 'loanApplications',
                attributes: ['id', 'status'],
            },
        ],
        order: [['created_at', 'DESC']],
    })

    return members.map((m) => enrichMember(m))
}

/**
 * Ambil satu anggota lengkap (dengan riwayat simpanan, pinjaman, pengajuan)
 */
async function getMemberById(memberId) {
    const member = await Member.findByPk(memberId, {
        include: [
            { model: User, as: 'user', attributes: USER_SAFE_ATTRS },
            { model: Saving, as: 'savings', order: [['date', 'DESC']] },
            { model: Loan, as: 'loans' },
            { model: LoanApplication, as: 'loanApplications', order: [['created_at', 'DESC']] },
        ],
    })
    if (!member) return null
    return enrichMember(member, true)
}

/**
 * Ambil member berdasarkan userId (untuk login anggota biasa)
 */
async function getMemberByUserId(userId) {
    const member = await Member.findOne({
        where: { userId },
        include: [
            { model: User, as: 'user', attributes: USER_SAFE_ATTRS },
            { model: Saving, as: 'savings', order: [['date', 'DESC']] },
            { model: Loan, as: 'loans' },
            { model: LoanApplication, as: 'loanApplications', order: [['created_at', 'DESC']] },
        ],
    })
    if (!member) return null
    return enrichMember(member, true)
}

/**
 * Hitung total simpanan & ringkasan pinjaman, flatten data user
 */
function enrichMember(member, detailed = false) {
    const raw = member.toJSON()
    const savings = raw.savings ?? []
    const loans = raw.loans ?? []
    const applications = raw.loanApplications ?? []

    const totalSavings = savings.reduce((sum, s) => sum + Number(s.amount), 0)
    const totalLoanRemaining = loans
        .filter((l) => l.status === 'active')
        .reduce((sum, l) => sum + Number(l.remaining), 0)

    const base = {
        id: raw.id,
        memberNumber: raw.memberNumber,
        birthPlaceAndDate: raw.birthPlaceAndDate,
        nik: raw.nik,
        address: raw.address,
        joinDate: raw.joinDate,
        status: raw.status,
        occupation: raw.occupation,
        monthlyIncome: raw.monthlyIncome,
        userId: raw.userId,
        // flatten dari relasi user
        name: raw.user?.name ?? '—',
        email: raw.user?.email ?? '—',
        phone: raw.user?.phone ?? '—',
        // ringkasan
        totalSavings,
        totalLoanRemaining,
        activeLoans: loans.filter((l) => l.status === 'active').length,
        pendingApplications: applications.filter((a) => a.status === 'pending').length,
        createdAt: raw.createdAt,
    }

    if (detailed) {
        return { ...base, savings, loans, loanApplications: applications }
    }
    return base
}

/**
 * Statistik dashboard admin
 */
async function getAdminStats() {
    const [totalMembers, activeMembers, pendingApplications, savingAgg, loanAgg] =
        await Promise.all([
            Member.count(),
            Member.count({ where: { status: 'active' } }),
            LoanApplication.count({ where: { status: 'pending' } }),
            Saving.sum('amount'),
            Loan.sum('remaining', { where: { status: 'active' } }),
        ])

    return {
        totalMembers,
        activeMembers,
        pendingApplications,
        totalSavings: savingAgg ?? 0,
        totalLoans: loanAgg ?? 0,
    }
}

/**
 * Buat anggota baru beserta user account-nya
 */
async function createMember({ name, email, password, phone, ...memberData }, hashedPassword) {
    // Cek email duplikat
    const existing = await User.findOne({ where: { email: email.toLowerCase() } })
    if (existing) return { success: false, error: 'Email sudah terdaftar' }

    const userId = generateId('u')
    const memberId = generateId('m')

    // Hitung nomor anggota berikutnya
    const count = await Member.count()
    const memberNumber = `KTA-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    await User.create({
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        name,
        phone: phone || null,
        memberId,
    })

    const member = await Member.create({
        id: memberId,
        userId,
        memberNumber,
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'active',
        ...memberData,
    })

    return { success: true, member }
}

/**
 * Update data member (dan user jika ada field name/phone)
 */
async function updateMember(memberId, data) {
    const member = await Member.findByPk(memberId, {
        include: [{ model: User, as: 'user' }],
    })
    if (!member) return { success: false, error: 'Anggota tidak ditemukan' }

    const { name, phone, ...memberFields } = data

    if (name || phone) {
        await member.user.update({
            ...(name && { name }),
            ...(phone && { phone }),
        })
    }

    await member.update(memberFields)
    return { success: true }
}

/**
 * Nonaktifkan / aktifkan anggota
 */
async function setMemberStatus(memberId, status) {
    const member = await Member.findByPk(memberId)
    if (!member) return { success: false, error: 'Anggota tidak ditemukan' }
    await member.update({ status })
    return { success: true }
}

/**
 * Anggota mengajukan pengunduran diri
 * Syarat: tidak ada pinjaman aktif
 */
async function submitResignation(memberId, reason) {
    const member = await Member.findByPk(memberId, {
        include: [{ model: Loan, as: 'loans', attributes: ['id', 'status', 'remaining'] }],
    })
    if (!member) return { success: false, error: 'Anggota tidak ditemukan' }

    if (member.resignationStatus === 'pending') {
        return { success: false, error: 'Pengajuan pengunduran diri sudah ada dan sedang ditinjau' }
    }

    const activeLoans = (member.loans ?? []).filter(
        (l) => l.status === 'active' && Number(l.remaining) > 0,
    )
    if (activeLoans.length > 0) {
        return {
            success: false,
            error: 'Tidak dapat mengajukan pengunduran diri karena masih memiliki pinjaman aktif',
        }
    }

    await member.update({
        resignationStatus: 'pending',
        resignationReason: reason || null,
        resignationRequestedAt: new Date(),
        resignationReviewedAt: null,
        resignationReviewedBy: null,
        resignationNotes: null,
    })

    return { success: true }
}

/**
 * Bendahara meninjau pengajuan pengunduran diri
 * decision: 'approved' | 'rejected'
 * Jika approved → nonaktifkan member & user
 */
async function reviewResignation(memberId, reviewerUserId, decision, notes) {
    if (!['approved', 'rejected'].includes(decision)) {
        return { success: false, error: 'Keputusan tidak valid' }
    }

    const member = await Member.findByPk(memberId, {
        include: [
            { model: User, as: 'user' },
            { model: Loan, as: 'loans', attributes: ['id', 'status', 'remaining'] },
        ],
    })
    if (!member) return { success: false, error: 'Anggota tidak ditemukan' }
    if (member.resignationStatus !== 'pending') {
        return { success: false, error: 'Tidak ada pengajuan pengunduran diri yang menunggu' }
    }

    if (decision === 'approved') {
        // Cek ulang pinjaman aktif saat disetujui
        const activeLoans = (member.loans ?? []).filter(
            (l) => l.status === 'active' && Number(l.remaining) > 0,
        )
        if (activeLoans.length > 0) {
            return {
                success: false,
                error: 'Anggota masih memiliki pinjaman aktif, tidak dapat disetujui',
            }
        }

        await member.update({ status: 'inactive' })
        if (member.user) {
            await member.user.update({ role: 'user' }) // tetap user, tapi member inactive
        }
    }

    await member.update({
        resignationStatus: decision,
        resignationReviewedAt: new Date(),
        resignationReviewedBy: reviewerUserId,
        resignationNotes: notes || null,
    })

    return { success: true }
}

/**
 * Ambil semua anggota dengan pengajuan pengunduran diri pending
 */
async function getPendingResignations() {
    const members = await Member.findAll({
        where: { resignationStatus: 'pending' },
        include: [{ model: User, as: 'user', attributes: USER_SAFE_ATTRS }],
        order: [['resignation_requested_at', 'ASC']],
    })
    return members.map((m) => {
        const raw = m.toJSON()
        return {
            id: raw.id,
            memberNumber: raw.memberNumber,
            name: raw.user?.name ?? '—',
            email: raw.user?.email ?? '—',
            phone: raw.user?.phone ?? '—',
            resignationStatus: raw.resignationStatus,
            resignationReason: raw.resignationReason,
            resignationRequestedAt: raw.resignationRequestedAt,
        }
    })
}

module.exports = {
    getAllMembers,
    getMemberById,
    getMemberByUserId,
    getAdminStats,
    createMember,
    updateMember,
    setMemberStatus,
    submitResignation,
    reviewResignation,
    getPendingResignations,
}