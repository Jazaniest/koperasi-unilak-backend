const { LoanApplication, Loan, Member, User, SystemLog } = require('../models')
const { generateId } = require('../utils/generateId')

// ── Helper ────────────────────────────────────────────────────────────────────

const MEMBER_INCLUDE = {
    model: Member,
    as: 'member',
    attributes: ['id', 'memberNumber', 'bankName', 'bankAccountNumber'], // ← tambahan field
    include: [{ model: User, as: 'user', attributes: ['name'] }],
}

function attachMemberInfo(raw) {
    return {
        ...raw,
        memberName: raw.member?.user?.name ?? '—',
        memberNumber: raw.member?.memberNumber ?? '—',
        memberBankName: raw.member?.bankName ?? null,                 // ← tambahan
        memberBankAccountNumber: raw.member?.bankAccountNumber ?? null, // ← tambahan
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
    if (filters.type) where.type = filters.type

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
        paymentMethod: data.paymentMethod || 'transfer', // ← tambahan
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

/**
 * Ajukan top up pinjaman (oleh anggota)
 * Syarat: ada loan active, amount > remaining loan aktif
 */
async function submitTopUpApplication(memberId, data) {
    // Cari pinjaman aktif
    const activeLoan = await Loan.findOne({
        where: { memberId, status: 'active' },
    })

    if (!activeLoan) {
        return { success: false, error: 'Tidak ada pinjaman aktif. Gunakan pengajuan pinjaman baru.' }
    }

    if (Number(data.amount) <= Number(activeLoan.remaining)) {
        return {
            success: false,
            error: `Jumlah top up harus lebih besar dari sisa pinjaman aktif (${activeLoan.remaining})`,
        }
    }

    // Cegah jika ada pengajuan top up pending
    const pending = await LoanApplication.count({
        where: { memberId, status: 'pending', type: 'topup' },
    })
    if (pending > 0) {
        return { success: false, error: 'Anda masih memiliki pengajuan top up yang menunggu persetujuan' }
    }

    const application = await LoanApplication.create({
        id: generateId('la'),
        memberId,
        amount: Number(data.amount),
        purpose: data.purpose,
        tenorMonths: Number(data.tenorMonths),
        collateral: data.collateral || null,
        paymentMethod: data.paymentMethod || 'transfer', // ← tambahan
        status: 'pending',
        type: 'topup',
        previousLoanId: activeLoan.id,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pengajuan top up pinjaman: ${application.id} dari anggota ${memberId}, previous loan: ${activeLoan.id}`,
    })

    return {
        success: true,
        application: application.toJSON(),
        activeLoan: activeLoan.toJSON(),
    }
}

/**
 * Review top up (approve / reject) oleh bendahara
 * Jika approved:
 *   1. Loan lama di-settle (status=lunas, diberi catatan top up)
 *   2. Loan baru dibuat dengan amount & tenor baru
 */
async function reviewTopUpApplication(appId, adminId, decision, adminNotes) {
    if (!['approved', 'rejected'].includes(decision)) {
        return { success: false, error: 'Keputusan tidak valid' }
    }

    const app = await LoanApplication.findByPk(appId)
    if (!app) return { success: false, error: 'Pengajuan tidak ditemukan' }
    if (app.status !== 'pending') return { success: false, error: 'Pengajuan sudah diproses' }
    if (app.type !== 'topup') return { success: false, error: 'Bukan pengajuan top up' }

    await app.update({
        status: decision,
        adminNotes: adminNotes || null,
        reviewedBy: adminId,
        reviewedAt: new Date().toISOString(),
    })

    let newLoan = null

    if (decision === 'approved') {
        // 1. Settle pinjaman lama
        const oldLoan = await Loan.findByPk(app.previousLoanId)
        if (oldLoan) {
            await oldLoan.update({
                status: 'lunas',
                settledAt: new Date().toISOString().slice(0, 10),
                settledBy: adminId,
            })

            // Catat pelunasan paksa via top up di LoanPayment
            const { LoanPayment } = require('../models')
            await LoanPayment.create({
                id: generateId('lp'),
                loanId: oldLoan.id,
                amount: Number(oldLoan.remaining),
                date: new Date().toISOString().slice(0, 10),
                description: `Dilunasi otomatis melalui top up (${appId})`,
                remainingAfter: 0,
            })
        }

        // 2. Buat pinjaman baru
        const INTEREST_RATE = 12
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
            purpose: `[TOP UP] ${app.purpose}`,
            startDate: new Date().toISOString().slice(0, 10),
            approvedBy: adminId,
        })
    }

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Top up ${appId} ${decision} oleh ${adminId}`,
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
    submitTopUpApplication,
    reviewTopUpApplication,
}