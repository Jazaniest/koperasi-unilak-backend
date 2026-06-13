const systemService = require('../services/systemService')
const { ok, fail } = require('../utils/response')

/**
 * GET /api/system/logs?limit=100
 * Ambil system logs
 */
async function getLogs(req, res) {
    const limit = parseInt(req.query.limit ?? 100, 10)
    const logs = await systemService.getSystemLogs(limit)
    return ok(res, logs)
}

/**
 * DELETE /api/system/logs
 * Hapus semua system logs — super_admin only
 */
async function clearLogs(req, res) {
    const result = await systemService.clearSystemLogs()
    return ok(res, result, `${result.deleted} log berhasil dihapus`)
}

/**
 * GET /api/system/metrics
 * Metrik server live: uptime, memory, db status
 */
async function getMetrics(req, res) {
    const metrics = await systemService.getServerMetrics()
    return ok(res, metrics)
}

/**
 * GET /api/system/db-stats
 * Jumlah baris per tabel
 */
async function getDbStats(req, res) {
    const stats = await systemService.getDatabaseStats()
    return ok(res, stats)
}

/**
 * GET /api/system/export
 * Download seluruh data sebagai JSON (tanpa password)
 * Response langsung sebagai file attachment
 */
async function exportDatabase(req, res) {
    const data = await systemService.exportDatabase()
    const filename = `koperasi-backup-${new Date().toISOString().slice(0, 10)}.json`

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/json')
    return res.json(data)
}

module.exports = {
    getLogs,
    clearLogs,
    getMetrics,
    getDbStats,
    exportDatabase,
}