const { LoanApplication, Loan, Member, User, SystemLog } = require('../models')
const { generateId } = require('../utils/generateId')

// ── Helper ────────────────────────────────────────────────────────────────────

const MEMBER_INCLUDE = {
    model: Member,
    as: 'member',
    attributes: ['id', 'memberNumber'],
    include: [{ model: User, as: 'user', attributes: ['name'] }],
}

function attachMemberInfo(raw) {
    return {
        ...raw,
        memberName: raw.member?.user?.name ?? '—',
        memberNumber: raw.member?.memberNumber ?? '—',
    }
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Semua pengajuan (admin) dengan filter opsional
 */
async function getLoanApplications(filters = {}) {
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.memberId) where.memberId = filters.memberId

    const apps = await LoanApplication.findAll({
        where,
        include: [MEMBER_INCLUDE],
        order: [['created_at', 'DESC']],
    })

    return apps.map((a) => attachMemberInfo(a.toJSON()))
}

/**
 * Pengajuan milik satu anggota
 */
async function getMemberApplications(memberId) {
    const apps = await LoanApplication.findAll({
        where: { memberId },
        order: [['created_at', 'DESC']],
    })
    return apps.map((a) => a.toJSON())
}

/**
 * Ajukan pinjaman baru (oleh anggota)
 * Cegah jika masih ada pengajuan pending
 */
async function submitLoanApplication(memberId, data) {
    const pending = await LoanApplication.count({
        where: { memberId, status: 'pending' },
    })

    if (pending > 0) {
        return {
            success: false,
            error: 'Anda masih memiliki pengajuan pinjaman yang menunggu persetujuan',
        }
    }

    const application = await LoanApplication.create({
        id: generateId('la'),
        memberId,
        amount: Number(data.amount),
        purpose: data.purpose,
        tenorMonths: Number(data.tenorMonths),
        collateral: data.collateral || 'Tidak ada',
        status: 'pending',
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pengajuan pinjaman baru: ${application.id} dari anggota ${memberId}`,
    })

    return { success: true, application: application.toJSON() }
}

/**
 * Review pengajuan (approve / reject) oleh admin
 * Jika approved → otomatis buat loan baru
 */
async function reviewLoanApplication(appId, adminId, decision, adminNotes) {
    if (!['approved', 'rejected'].includes(decision)) {
        return { success: false, error: 'Keputusan tidak valid, gunakan "approved" atau "rejected"' }
    }

    const app = await LoanApplication.findByPk(appId)
    if (!app) return { success: false, error: 'Pengajuan tidak ditemukan' }
    if (app.status !== 'pending') return { success: false, error: 'Pengajuan sudah diproses' }

    await app.update({
        status: decision,
        adminNotes: adminNotes || null,
        reviewedBy: adminId,
        reviewedAt: new Date().toISOString(),
    })

    let newLoan = null

    if (decision === 'approved') {
        const INTEREST_RATE = 12 // persen per tahun, sesuai loanService frontend
        const monthlyPayment = Math.round(
            (app.amount * (1 + INTEREST_RATE / 100)) / app.tenorMonths,
        )

        newLoan = await Loan.create({
            id: generateId('ln'),
            memberId: app.memberId,
            amount: Number(app.amount),
            remaining: Number(app.amount),
            interestRate: INTEREST_RATE,
            tenorMonths: app.tenorMonths,
            monthlyPayment,
            status: 'active',
            purpose: app.purpose,
            startDate: new Date().toISOString().slice(0, 10),
            approvedBy: adminId,
        })
    }

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pengajuan ${appId} ${decision} oleh admin ${adminId}`,
    })

    return {
        success: true,
        ...(newLoan && { loan: newLoan.toJSON() }),
    }
}

module.exports = {
    getLoanApplications,
    getMemberApplications,
    submitLoanApplication,
    reviewLoanApplication,
}