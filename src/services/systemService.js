const { sequelize, SystemLog, User, Member, Saving, Loan, LoanApplication, LoanPayment } = require('../models')
const { generateId } = require('../utils/generateId')

// ── System Logs ───────────────────────────────────────────────────────────────

/**
 * Ambil system logs, terbaru di atas
 * @param {number} limit - max baris yang dikembalikan (default 100)
 */
async function getSystemLogs(limit = 100) {
    const logs = await SystemLog.findAll({
        order: [['created_at', 'DESC']],
        limit: Math.min(limit, 500), // hard cap 500
    })
    return logs.map((l) => l.toJSON())
}

/**
 * Tambah log manual (bisa dipanggil dari mana saja)
 */
async function addSystemLog(level, message) {
    return SystemLog.create({
        id: generateId('log'),
        level,
        message,
    })
}

/**
 * Hapus semua log (super_admin only)
 */
async function clearSystemLogs() {
    const count = await SystemLog.count()
    await SystemLog.destroy({ where: {}, truncate: true })
    return { deleted: count }
}

// ── Server Metrics ────────────────────────────────────────────────────────────

/**
 * Metrik server live — uptime process, memory usage, db connection check
 */
async function getServerMetrics() {
    // Cek koneksi DB
    let dbStatus = 'connected'
    try {
        await sequelize.authenticate()
    } catch {
        dbStatus = 'error'
    }

    const mem = process.memoryUsage()
    const uptime = process.uptime() // detik

    return {
        status: dbStatus === 'connected' ? 'online' : 'error',
        uptime: formatUptime(uptime),
        uptimeSeconds: Math.floor(uptime),
        memory: {
            used: Math.round(mem.heapUsed / 1024 / 1024), // MB
            total: Math.round(mem.heapTotal / 1024 / 1024),
            rss: Math.round(mem.rss / 1024 / 1024),
        },
        database: {
            status: dbStatus,
            dialect: sequelize.getDialect(),
            name: sequelize.getDatabaseName(),
        },
        nodeVersion: process.version,
        lastChecked: new Date().toISOString(),
    }
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}h ${h}j ${m}m`
    if (h > 0) return `${h}j ${m}m`
    return `${m}m`
}

// ── Database Stats ────────────────────────────────────────────────────────────

/**
 * Hitung jumlah baris per tabel — berguna untuk halaman system info
 */
async function getDatabaseStats() {
    const [users, members, savings, loans, loanApplications, loanPayments, systemLogs] =
        await Promise.all([
            User.count(),
            Member.count(),
            Saving.count(),
            Loan.count(),
            LoanApplication.count(),
            LoanPayment.count(),
            SystemLog.count(),
        ])

    return {
        tables: {
            users,
            members,
            savings,
            loans,
            loanApplications,
            loanPayments,
            systemLogs,
        },
        totalRows: users + members + savings + loans + loanApplications + loanPayments + systemLogs,
    }
}

// ── Export / Import ───────────────────────────────────────────────────────────

/**
 * Export seluruh data sebagai JSON
 * Cocok untuk backup manual
 */
async function exportDatabase() {
    const [users, members, savings, loans, loanApplications, loanPayments, systemLogs] =
        await Promise.all([
            User.findAll({ attributes: { exclude: ['password'] } }), // jangan export password
            Member.findAll(),
            Saving.findAll(),
            Loan.findAll(),
            LoanApplication.findAll(),
            LoanPayment.findAll(),
            SystemLog.findAll({ order: [['created_at', 'DESC']], limit: 200 }),
        ])

    return {
        exportedAt: new Date().toISOString(),
        version: 2,
        data: {
            users: users.map((r) => r.toJSON()),
            members: members.map((r) => r.toJSON()),
            savings: savings.map((r) => r.toJSON()),
            loans: loans.map((r) => r.toJSON()),
            loanApplications: loanApplications.map((r) => r.toJSON()),
            loanPayments: loanPayments.map((r) => r.toJSON()),
            systemLogs: systemLogs.map((r) => r.toJSON()),
        },
    }
}

module.exports = {
    getSystemLogs,
    addSystemLog,
    clearSystemLogs,
    getServerMetrics,
    getDatabaseStats,
    exportDatabase,
}