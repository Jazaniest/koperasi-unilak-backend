require('dotenv').config()
const app = require('./app')
const { sequelize } = require('./models')

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    // Test koneksi database
    await sequelize.authenticate()
    console.log('✅ Database terhubung')

    // Sync model ke tabel (alter: true aman untuk development)
    // Ganti dengan migration Sequelize jika sudah production
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
    console.log('✅ Model tersinkron ke database')

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`)
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    console.error('❌ Gagal menjalankan server:', err)
    process.exit(1)
  }
}

startServer()
