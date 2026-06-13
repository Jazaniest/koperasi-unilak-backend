const { Loan, LoanPayment, Member, User } = require('../models')
const { generateId } = require('../utils/generateId')
const { SystemLog } = require('../models')

// ── Helper ────────────────────────────────────────────────────────────────────

function attachMemberInfo(raw) {
    return {
        ...raw,
        memberName: raw.member?.user?.name ?? '—',
        memberNumber: raw.member?.memberNumber ?? '—',
    }
}

const MEMBER_INCLUDE = {
    model: Member,
    as: 'member',
    attributes: ['id', 'memberNumber'],
    include: [{ model: User, as: 'user', attributes: ['name'] }],
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Semua pinjaman (admin/bendahara) dengan info anggota
 */
async function getAllLoans(filters = {}) {
    const where = {}
    if (filters.status) where.status = filters.status
    if (filters.memberId) where.memberId = filters.memberId

    const loans = await Loan.findAll({
        where,
        include: [MEMBER_INCLUDE],
        order: [['created_at', 'DESC']],
    })

    return loans.map((l) => attachMemberInfo(l.toJSON()))
}

/**
 * Pinjaman milik satu anggota
 */
async function getMemberLoans(memberId) {
    const loans = await Loan.findAll({
        where: { memberId },
        order: [['created_at', 'DESC']],
    })
    return loans.map((l) => l.toJSON())
}

/**
 * Detail satu pinjaman + riwayat pembayarannya
 */
async function getLoanDetail(loanId) {
    const loan = await Loan.findByPk(loanId, {
        include: [
            MEMBER_INCLUDE,
            {
                model: LoanPayment,
                as: 'payments',
                order: [['date', 'DESC']],
            },
        ],
    })
    if (!loan) return null

    const raw = loan.toJSON()
    return attachMemberInfo(raw)
}

/**
 * Catat pembayaran cicilan (oleh bendahara)
 */
async function recordLoanPayment({ loanId, amount, description }) {
    const loan = await Loan.findByPk(loanId)
    if (!loan) return { success: false, error: 'Pinjaman tidak ditemukan' }
    if (loan.status !== 'active') return { success: false, error: 'Pinjaman tidak aktif' }

    const paid = Number(amount)
    if (paid <= 0) return { success: false, error: 'Jumlah pembayaran harus lebih dari 0' }
    if (paid > Number(loan.remaining)) return { success: false, error: 'Jumlah melebihi sisa pinjaman' }

    const newRemaining = Math.max(0, Number(loan.remaining) - paid)
    const newStatus = newRemaining === 0 ? 'lunas' : 'active'

    await loan.update({ remaining: newRemaining, status: newStatus })

    const payment = await LoanPayment.create({
        id: generateId('pay'),
        loanId,
        amount: paid,
        date: new Date().toISOString().slice(0, 10),
        description: description || 'Pembayaran cicilan',
        remainingAfter: newRemaining,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Cicilan pinjaman ${loanId}: bayar ${paid}, sisa ${newRemaining}`,
    })

    return { success: true, payment: payment.toJSON(), newRemaining, newStatus }
}

/**
 * Pelunasan sekaligus (settle full)
 */
async function settleLoan(loanId, processedBy) {
    const loan = await Loan.findByPk(loanId)
    if (!loan) return { success: false, error: 'Pinjaman tidak ditemukan' }
    if (loan.status !== 'active') return { success: false, error: 'Pinjaman tidak aktif' }

    const sisaPelunasan = Number(loan.remaining)
    const today = new Date().toISOString().slice(0, 10)

    await loan.update({
        remaining: 0,
        status: 'lunas',
        settledAt: today,
        settledBy: processedBy,
    })

    await LoanPayment.create({
        id: generateId('pay'),
        loanId,
        amount: sisaPelunasan,
        date: today,
        description: 'Pelunasan penuh',
        remainingAfter: 0,
    })

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Pinjaman ${loanId} dilunasi penuh oleh ${processedBy}`,
    })

    return { success: true }
}

/**
 * Riwayat pembayaran satu pinjaman (atau semua jika loanId tidak diberikan)
 */
async function getLoanPayments(loanId) {
    const where = loanId ? { loanId } : {}
    const payments = await LoanPayment.findAll({
        where,
        order: [['date', 'DESC']],
    })
    return payments.map((p) => p.toJSON())
}

module.exports = {
    getAllLoans,
    getMemberLoans,
    getLoanDetail,
    recordLoanPayment,
    settleLoan,
    getLoanPayments,
}