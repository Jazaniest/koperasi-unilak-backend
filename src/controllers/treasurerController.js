const treasurerService = require('../services/treasurerService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/treasurer/stats
 * Ringkasan keuangan koperasi (kas, simpanan, pinjaman, estimasi bunga)
 */
async function getStats(req, res) {
    const stats = await treasurerService.getTreasurerStats()
    return ok(res, stats)
}

/**
 * GET /api/treasurer/report/monthly?year=2025&month=6
 * Laporan keuangan satu bulan tertentu
 */
async function getMonthlyReport(req, res) {
    const year = parseInt(req.query.year ?? new Date().getFullYear(), 10)
    const month = parseInt(req.query.month ?? new Date().getMonth() + 1, 10)

    if (month < 1 || month > 12) return fail(res, 'Bulan tidak valid (1–12)')

    const report = await treasurerService.getMonthlyReport(year, month)
    return ok(res, report)
}

/**
 * GET /api/treasurer/report/last6months
 * Laporan 6 bulan terakhir (untuk grafik dashboard)
 */
async function getLast6MonthsReport(req, res) {
    const reports = await treasurerService.getLast6MonthsReport()
    return ok(res, reports)
}

/**
 * POST /api/treasurer/process/cicilan
 * Proses cicilan bulanan semua pinjaman aktif secara manual
 */
async function processCicilan(req, res) {
    const results = await treasurerService.processMonthlyCicilan()
    return ok(
        res,
        { processed: results.length, detail: results },
        `${results.length} pinjaman berhasil diproses`,
    )
}

/**
 * POST /api/treasurer/process/simpanan-wajib
 * Proses simpanan wajib otomatis semua anggota aktif secara manual
 */
async function processSimpananWajib(req, res) {
    const results = await treasurerService.processSimapananWajib()
    const added = results.filter((r) => !r.skipped).length
    const skipped = results.filter((r) => r.skipped).length
    return ok(
        res,
        { added, skipped, detail: results },
        `Simpanan wajib diproses: ${added} ditambahkan, ${skipped} dilewati`,
    )
}

/**
 * GET /api/treasurer/history?year=2026&month=3
 * Riwayat transaksi detail per bulan
 */
async function getTransactionHistory(req, res) {
    const year = parseInt(req.query.year ?? new Date().getFullYear(), 10)
    const month = parseInt(req.query.month ?? new Date().getMonth() + 1, 10)
    if (month < 1 || month > 12) return fail(res, 'Bulan tidak valid (1–12)')
    const data = await treasurerService.getTransactionHistory(year, month)
    return ok(res, data)
}

/**
 * GET /api/treasurer/report/yearly?year=2026
 * Laporan agregat 12 bulan dalam satu tahun
 */
async function getYearlyReport(req, res) {
    const year = parseInt(req.query.year ?? new Date().getFullYear(), 10)
    const data = await treasurerService.getYearlyReport(year)
    return ok(res, data)
}

module.exports = {
    getStats,
    getMonthlyReport,
    getLast6MonthsReport,
    processCicilan,
    processSimpananWajib,
    getTransactionHistory,
    getYearlyReport,
}