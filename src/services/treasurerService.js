const { sequelize, Saving, Loan, LoanPayment, Member, SystemLog } = require('../models')
const { generateId } = require('../utils/generateId')

// ── Ringkasan Keuangan ────────────────────────────────────────────────────────

async function getTreasurerStats() {
    const [
        totalSimpananPokok,
        totalSimpananWajib,
        totalSimpananSukarela,
        totalPinjamanDikucurkan,
        totalSisaPinjaman,
        totalPinjamanAktif,
        totalAnggota,
        totalAnggotaAktif,
        activeLoans,
    ] = await Promise.all([
        Saving.sum('amount', { where: { type: 'pokok' } }),
        Saving.sum('amount', { where: { type: 'wajib' } }),
        Saving.sum('amount', { where: { type: 'sukarela' } }),
        Loan.sum('amount'),
        Loan.sum('remaining', { where: { status: 'active' } }),
        Loan.count({ where: { status: 'active' } }),
        Member.count(),
        Member.count({ where: { status: 'active' } }),
        Loan.findAll({
            where: { status: 'active' },
            attributes: ['remaining', 'interestRate'],
        }),
    ])

    const pokok = Number(totalSimpananPokok ?? 0)
    const wajib = Number(totalSimpananWajib ?? 0)
    const sukarela = Number(totalSimpananSukarela ?? 0)
    const totalSimpanan = pokok + wajib + sukarela
    const sisaPinjaman = Number(totalSisaPinjaman ?? 0)
    const totalKas = totalSimpanan - sisaPinjaman

    const estimasiBungaBulanIni = activeLoans.reduce((sum, l) => {
        return sum + (Number(l.remaining) * Number(l.interestRate)) / 100 / 12
    }, 0)

    return {
        totalSimpanan,
        totalSimpananPokok: pokok,
        totalSimpananWajib: wajib,
        totalSimpananSukarela: sukarela,
        totalPinjamanDikucurkan: Number(totalPinjamanDikucurkan ?? 0),
        totalSisaPinjaman: sisaPinjaman,
        totalPinjamanAktif,
        totalKas,
        estimasiBungaBulanIni: Math.round(estimasiBungaBulanIni * 100) / 100,
        totalAnggota,
        totalAnggotaAktif,
    }
}

// ── Laporan Bulanan ───────────────────────────────────────────────────────────

async function getMonthlyReport(year, month) {
    const pad = (n) => String(n).padStart(2, '0')
    const prefix = `${year}-${pad(month)}`

    const monthFilter = (col) =>
        sequelize.where(sequelize.fn('DATE_FORMAT', sequelize.col(col), '%Y-%m'), prefix)

    const [simpananMasuk, cicilanDiterima, activeLoans] = await Promise.all([
        Saving.sum('amount', { where: monthFilter('date') }),
        LoanPayment.sum('amount', { where: monthFilter('date') }),
        Loan.findAll({
            where: { status: 'active' },
            attributes: ['remaining', 'interestRate'],
        }),
    ])

    const bungaDiterima = Math.round(
        activeLoans.reduce((sum, l) => {
            return sum + (Number(l.remaining) * Number(l.interestRate)) / 100 / 12
        }, 0) * 100
    ) / 100

    const simpanan = Number(simpananMasuk ?? 0)
    const cicilan = Number(cicilanDiterima ?? 0)

    return {
        year,
        month,
        simpananMasuk: simpanan,
        cicilanDiterima: cicilan,
        bungaDiterima,
        totalPemasukan: simpanan + cicilan + bungaDiterima,
    }
}

async function getLast6MonthsReport() {
    const reports = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        reports.push(await getMonthlyReport(d.getFullYear(), d.getMonth() + 1))
    }
    return reports
}

// ── Proses Cicilan Bulanan ────────────────────────────────────────────────────

async function processMonthlyCicilan() {
    const activeLoans = await Loan.findAll({ where: { status: 'active' } })
    const results = []
    const today = new Date().toISOString().slice(0, 10)

    for (const loan of activeLoans) {
        const bayar = Math.min(Number(loan.monthlyPayment), Number(loan.remaining))
        const newRemaining = Math.max(0, Number(loan.remaining) - bayar)
        const newStatus = newRemaining <= 0.001 ? 'lunas' : 'active'

        await loan.update({ remaining: newRemaining, status: newStatus })

        await LoanPayment.create({
            id: generateId('pay'),
            loanId: loan.id,
            amount: bayar,
            date: today,
            description: 'Proses cicilan bulanan',
            remainingAfter: newRemaining,
        })

        results.push({ loanId: loan.id, amount: bayar, remaining: newRemaining })
    }

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Proses cicilan bulanan: ${results.length} pinjaman diproses`,
    })

    return results
}

// ── Proses Simpanan Wajib Otomatis ────────────────────────────────────────────

const NOMINAL_WAJIB_DEFAULT = 100000

async function processSimapananWajib() {
    const today = new Date().toISOString().slice(0, 10)
    const thisMonthPrefix = today.slice(0, 7) // "YYYY-MM"

    const activeMembers = await Member.findAll({ where: { status: 'active' } })
    const results = []

    for (const member of activeMembers) {
        // Cegah duplikasi: skip jika bulan ini sudah ada simpanan wajib
        const existing = await Saving.findOne({
            where: {
                memberId: member.id,
                type: 'wajib',
                date: sequelize.where(
                    sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'),
                    thisMonthPrefix,
                ),
            },
        })

        if (existing) {
            results.push({ memberId: member.id, skipped: true })
            continue
        }

        await Saving.create({
            id: generateId('sv'),
            memberId: member.id,
            type: 'wajib',
            amount: NOMINAL_WAJIB_DEFAULT,
            date: today,
            description: `Simpanan wajib otomatis ${thisMonthPrefix}`,
        })

        results.push({ memberId: member.id, amount: NOMINAL_WAJIB_DEFAULT, skipped: false })
    }

    await SystemLog.create({
        id: generateId('log'),
        level: 'info',
        message: `Proses simpanan wajib ${thisMonthPrefix}: ${results.filter((r) => !r.skipped).length} anggota`,
    })

    return results
}

/**
 * Riwayat transaksi detail per bulan
 * Menggabungkan: cicilan, simpanan, dan top up
 */
async function getTransactionHistory(year, month) {
    const { Op } = require('sequelize')
    const { LoanApplication, User } = require('../models')

    const pad = (n) => String(n).padStart(2, '0')
    const startDate = `${year}-${pad(month)}-01`
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10)
    const dateRange = { [Op.between]: [startDate, endDate] }

    const [payments, savings, topupApps, allMembers] = await Promise.all([
        // Cicilan bulan ini
        LoanPayment.findAll({
            where: { date: dateRange },
            include: [{
                model: Loan,
                as: 'loan',
                attributes: ['id', 'amount', 'remaining', 'tenorMonths', 'monthlyPayment', 'purpose', 'memberId'],
                include: [{
                    model: Member,
                    as: 'member',
                    attributes: ['id', 'memberNumber'],
                    include: [{ model: User, as: 'user', attributes: ['name'] }],
                }],
            }],
            order: [['date', 'ASC']],
        }),

        // Simpanan wajib bulan ini
        Saving.findAll({
            where: { date: dateRange, type: 'wajib' },
            include: [{
                model: Member,
                as: 'member',
                attributes: ['id', 'memberNumber'],
                include: [{ model: User, as: 'user', attributes: ['name'] }],
            }],
        }),

        // Top up disetujui bulan ini
        LoanApplication.findAll({
            where: {
                type: 'topup',
                status: 'approved',
                reviewedAt: {
                    [Op.between]: [
                        new Date(`${startDate}T00:00:00`),
                        new Date(`${endDate}T23:59:59`),
                    ],
                },
            },
            attributes: ['previousLoanId'],
        }),

        // Semua anggota aktif (untuk yang tidak punya cicilan)
        Member.findAll({
            where: { status: 'active' },
            attributes: ['id', 'memberNumber', 'occupation'],
            include: [{ model: User, as: 'user', attributes: ['name'] }],
            order: [['memberNumber', 'ASC']],
        }),
    ])

    // Set loan ID yang merupakan hasil top up bulan ini
    const topupLoanIds = new Set(topupApps.map((t) => t.previousLoanId).filter(Boolean))

    // Map simpanan wajib per memberId
    const wajibByMember = {}
    savings.forEach((s) => {
        wajibByMember[s.member.id] = Number(s.amount)
    })

    // Map cicilan per memberId
    const cicilanByMember = {}
    payments.forEach((p) => {
        const memberId = p.loan?.memberId
        if (memberId) cicilanByMember[memberId] = p
    })

    // Gabungkan: semua anggota aktif sebagai basis baris
    const rows = allMembers.map((m) => {
        const cicilan = cicilanByMember[m.id] ?? null
        const wajib = wajibByMember[m.id] ?? 0
        const isTopUp = cicilan ? topupLoanIds.has(cicilan.loan?.id) : false

        const angsuranPokok = cicilan ? Number(cicilan.amount) : 0
        const piutangAwal = cicilan ? Number(cicilan.remainingAfter) + Number(cicilan.amount) : 0
        const piutangAkhir = cicilan ? Number(cicilan.remainingAfter) : 0
        const jasa = cicilan ? Math.round(((piutangAkhir * 0.12) / 12) * 100) / 100 : 0
        const jumlahPotongan = wajib + angsuranPokok + jasa
        const angsuranKe = cicilan && cicilan.loan?.monthlyPayment > 0
            ? Math.round(((Number(cicilan.loan.amount) - piutangAkhir) / Number(cicilan.loan.monthlyPayment)) * 100) / 100
            : 0

        return {
            memberId: m.id,
            memberName: m.user?.name ?? '—',
            memberNumber: m.memberNumber ?? '—',
            occupation: m.occupation ?? '—',
            loanAmount: cicilan ? Number(cicilan.loan?.amount ?? 0) : 0,
            piutangAwal,
            simpananWajib: wajib,
            angsuranPokok,
            jasa,
            jumlahPotongan,
            angsuranKe,
            tenorMonths: cicilan ? (cicilan.loan?.tenorMonths ?? 0) : 0,
            piutangAkhir,
            isTopUp,
            hasPinjaman: !!cicilan,
        }
    })

    return { year, month, rows }
}

/**
 * Laporan tahunan — agregat 12 bulan
 */
async function getYearlyReport(year) {
    const months = []
    for (let m = 1; m <= 12; m++) {
        months.push(await getMonthlyReport(year, m))
    }

    const totals = months.reduce((acc, r) => ({
        simpananMasuk: acc.simpananMasuk + r.simpananMasuk,
        cicilanDiterima: acc.cicilanDiterima + r.cicilanDiterima,
        bungaDiterima: acc.bungaDiterima + r.bungaDiterima,
        totalPemasukan: acc.totalPemasukan + r.totalPemasukan,
    }), { simpananMasuk: 0, cicilanDiterima: 0, bungaDiterima: 0, totalPemasukan: 0 })

    return { year, months, totals }
}

module.exports = {
    getTreasurerStats,
    getMonthlyReport,
    getLast6MonthsReport,
    processMonthlyCicilan,
    processSimapananWajib,
    getTransactionHistory,
    getYearlyReport,
    NOMINAL_WAJIB_DEFAULT,
}