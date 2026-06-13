/**
 * Seed database dengan data demo.
 * Jalankan SEKALI setelah server pertama kali dijalankan dan tabel sudah terbuat:
 *
 *   node src/scripts/seed.js
 *
 * Script ini aman dijalankan ulang — setiap tabel dicek dulu,
 * jika sudah ada data maka seed dilewati.
 */

require('dotenv').config()
const bcrypt = require('bcrypt')
const { sequelize, User, Member, Saving, Loan, LoanApplication, LoanPayment, SystemLog } = require('../models')

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

async function run() {
    await sequelize.authenticate()
    console.log('✅ DB terhubung\n')

    // Jika sudah ada user, skip
    const existingUsers = await User.count()
    if (existingUsers > 0) {
        console.log('⚠️  Data sudah ada, seed dilewati.')
        console.log('   Hapus semua data terlebih dahulu jika ingin reset.\n')
        await sequelize.close()
        return
    }

    console.log('📦 Menyiapkan data seed...\n')

    // ── Users ──────────────────────────────────────────────────────────────────
    const passwords = await Promise.all([
        bcrypt.hash('super123', BCRYPT_ROUNDS),
        bcrypt.hash('admin123', BCRYPT_ROUNDS),
        bcrypt.hash('bendahara123', BCRYPT_ROUNDS),
        bcrypt.hash('user123', BCRYPT_ROUNDS),
        bcrypt.hash('user123', BCRYPT_ROUNDS),
        bcrypt.hash('user123', BCRYPT_ROUNDS),
    ])

    await User.bulkCreate([
        {
            id: 'u-super',
            email: 'superadmin@koperasi.dev',
            password: passwords[0],
            role: 'super_admin',
            name: 'Developer Super',
            phone: '08110000001',
        },
        {
            id: 'u-admin',
            email: 'admin@koperasi.dev',
            password: passwords[1],
            role: 'admin',
            name: 'Rina Wijaya',
            phone: '08110000002',
        },
        {
            id: 'u-bendahara',
            email: 'bendahara@koperasi.dev',
            password: passwords[2],
            role: 'bendahara',
            name: 'Dewi Kurniawati',
            phone: '08110000003',
        },
        {
            id: 'u-budi',
            email: 'budi@koperasi.dev',
            password: passwords[3],
            role: 'user',
            name: 'Budi Santoso',
            phone: '081234567890',
            memberId: 'm-001',
        },
        {
            id: 'u-siti',
            email: 'siti@koperasi.dev',
            password: passwords[4],
            role: 'user',
            name: 'Siti Aminah',
            phone: '081298765432',
            memberId: 'm-002',
        },
        {
            id: 'u-agus',
            email: 'agus@koperasi.dev',
            password: passwords[5],
            role: 'user',
            name: 'Agus Pratama',
            phone: '081355512345',
            memberId: 'm-003',
        },
    ])
    console.log('✅ Users (6)')

    // ── Members ────────────────────────────────────────────────────────────────
    await Member.bulkCreate([
        {
            id: 'm-001',
            userId: 'u-budi',
            memberNumber: 'KTA-2024-001',
            birthPlaceAndDate: '1990-05-15',
            nik: '3201010101010001',
            address: 'Jl. Melati No. 12, Jakarta Selatan',
            joinDate: '2024-03-10',
            status: 'active',
            occupation: 'Karyawan Swasta',
            monthlyIncome: 8500000,
        },
        {
            id: 'm-002',
            userId: 'u-siti',
            memberNumber: 'KTA-2024-002',
            birthPlaceAndDate: '1985-08-20',
            nik: '3201010202020002',
            address: 'Jl. Kenanga No. 5, Depok',
            joinDate: '2024-04-20',
            status: 'active',
            occupation: 'Guru',
            monthlyIncome: 6200000,
        },
        {
            id: 'm-003',
            userId: 'u-agus',
            memberNumber: 'KTA-2024-003',
            birthPlaceAndDate: '1988-12-10',
            nik: '3201010303030003',
            address: 'Jl. Mawar No. 8, Tangerang',
            joinDate: '2024-06-01',
            status: 'active',
            occupation: 'Wiraswasta',
            monthlyIncome: 12000000,
        },
    ])
    console.log('✅ Members (3)')

    // ── Savings ────────────────────────────────────────────────────────────────
    await Saving.bulkCreate([
        { id: 'sv-001', memberId: 'm-001', type: 'pokok', amount: 500000, date: '2024-03-10', description: 'Simpanan pokok awal' },
        { id: 'sv-002', memberId: 'm-001', type: 'wajib', amount: 100000, date: '2024-04-01', description: 'Simpanan wajib bulan April' },
        { id: 'sv-003', memberId: 'm-001', type: 'wajib', amount: 100000, date: '2024-05-01', description: 'Simpanan wajib bulan Mei' },
        { id: 'sv-004', memberId: 'm-001', type: 'sukarela', amount: 250000, date: '2024-05-15', description: 'Tabungan sukarela' },
        { id: 'sv-005', memberId: 'm-002', type: 'pokok', amount: 500000, date: '2024-04-20', description: 'Simpanan pokok awal' },
        { id: 'sv-006', memberId: 'm-002', type: 'wajib', amount: 100000, date: '2024-05-01', description: 'Simpanan wajib bulan Mei' },
        { id: 'sv-007', memberId: 'm-002', type: 'sukarela', amount: 150000, date: '2024-06-01', description: 'Tabungan sukarela' },
        { id: 'sv-008', memberId: 'm-003', type: 'pokok', amount: 500000, date: '2024-06-01', description: 'Simpanan pokok awal' },
        { id: 'sv-009', memberId: 'm-003', type: 'wajib', amount: 100000, date: '2024-07-01', description: 'Simpanan wajib bulan Juli' },
    ])
    console.log('✅ Savings (9)')

    // ── Loans ──────────────────────────────────────────────────────────────────
    await Loan.bulkCreate([
        {
            id: 'ln-001',
            memberId: 'm-001',
            amount: 15000000,
            remaining: 10500000,
            interestRate: 12,
            tenorMonths: 24,
            monthlyPayment: 705000,
            status: 'active',
            purpose: 'Renovasi rumah',
            startDate: '2024-05-01',
            approvedBy: 'u-admin',
        },
        {
            id: 'ln-002',
            memberId: 'm-002',
            amount: 5000000,
            remaining: 3200000,
            interestRate: 10,
            tenorMonths: 12,
            monthlyPayment: 458000,
            status: 'active',
            purpose: 'Biaya pendidikan anak',
            startDate: '2024-06-15',
            approvedBy: 'u-admin',
        },
    ])
    console.log('✅ Loans (2)')

    // ── Loan Applications ──────────────────────────────────────────────────────
    await LoanApplication.bulkCreate([
        {
            id: 'la-001',
            memberId: 'm-003',
            amount: 8000000,
            purpose: 'Modal usaha catering',
            tenorMonths: 18,
            collateral: 'BPKB motor Honda Beat 2020',
            status: 'pending',
            createdAt: '2025-05-18T08:30:00.000Z',
        },
        {
            id: 'la-002',
            memberId: 'm-001',
            amount: 3000000,
            purpose: 'Dana darurat kesehatan',
            tenorMonths: 6,
            collateral: 'Tidak ada',
            status: 'approved',
            adminNotes: 'Disetujui sesuai limit anggota',
            reviewedBy: 'u-admin',
            reviewedAt: '2025-04-11T09:00:00.000Z',
            createdAt: '2025-04-10T10:00:00.000Z',
        },
        {
            id: 'la-003',
            memberId: 'm-002',
            amount: 20000000,
            purpose: 'Renovasi toko',
            tenorMonths: 36,
            collateral: 'Sertifikat tanah',
            status: 'rejected',
            adminNotes: 'Melebihi batas maksimal pinjaman 3x simpanan',
            reviewedBy: 'u-admin',
            reviewedAt: '2025-03-06T11:00:00.000Z',
            createdAt: '2025-03-05T14:00:00.000Z',
        },
    ])
    console.log('✅ Loan Applications (3)')

    // ── Loan Payments ──────────────────────────────────────────────────────────
    await LoanPayment.bulkCreate([
        { id: 'pay-001', loanId: 'ln-001', amount: 705000, date: '2024-06-01', description: 'Pembayaran cicilan bulan Juni', remainingAfter: 14295000 },
        { id: 'pay-002', loanId: 'ln-001', amount: 705000, date: '2024-07-01', description: 'Pembayaran cicilan bulan Juli', remainingAfter: 13590000 },
        { id: 'pay-003', loanId: 'ln-002', amount: 458000, date: '2024-07-15', description: 'Pembayaran cicilan bulan Juli', remainingAfter: 4542000 },
        { id: 'pay-004', loanId: 'ln-001', amount: 705000, date: '2024-08-01', description: 'Pembayaran cicilan bulan Agustus', remainingAfter: 12885000 },
        { id: 'pay-005', loanId: 'ln-002', amount: 458000, date: '2024-08-15', description: 'Pembayaran cicilan bulan Agustus', remainingAfter: 4084000 },
    ])
    console.log('✅ Loan Payments (5)')

    // ── System Logs ────────────────────────────────────────────────────────────
    await SystemLog.bulkCreate([
        { id: 'log-seed-1', level: 'info', message: 'Database seed diinisialisasi' },
        { id: 'log-seed-2', level: 'info', message: 'Server berjalan normal' },
    ])
    console.log('✅ System Logs (2)')

    console.log('\n🎉 Seed selesai! Akun demo:')
    console.log('   superadmin@koperasi.dev  /  super123')
    console.log('   admin@koperasi.dev       /  admin123')
    console.log('   bendahara@koperasi.dev   /  bendahara123')
    console.log('   budi@koperasi.dev        /  user123')

    await sequelize.close()
}

run().catch((err) => {
    console.error('❌ Seed gagal:', err)
    process.exit(1)
})