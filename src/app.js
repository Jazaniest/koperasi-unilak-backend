require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const path = require('path')

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',              require('./routes/auth'))
app.use('/api/members',           require('./routes/members'))
app.use('/api/savings',           require('./routes/savings'))
app.use('/api/loans',             require('./routes/loans'))
app.use('/api/loan-applications', require('./routes/loanApplications'))
app.use('/api/treasurer',         require('./routes/treasurer'))
app.use('/api/system',            require('./routes/system'))
app.use('/api/registrations',     require('./routes/registrations'))
app.use('/api/news', require('./routes/news'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan` })
})

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  })
})

module.exports = app