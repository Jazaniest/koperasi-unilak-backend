const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

/**
 * RegistrationRequest — menyimpan permintaan pendaftaran anggota baru
 * yang menunggu persetujuan admin.
 *
 * status:
 *   pending  — baru masuk, belum ditinjau
 *   approved — disetujui admin, akun user+member sudah dibuat
 *   rejected — ditolak admin
 */
const RegistrationRequest = sequelize.define('registration_requests', {
    id: {
        type: DataTypes.STRING(30),
        primaryKey: true,
    },
    // Data akun
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    // Password sudah di-hash saat submit
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    // Data anggota (opsional saat daftar)
    nik: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    birthPlaceAndDate: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'birth_place_and_date',
    },
    occupation: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    monthlyIncome: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'monthly_income',
    },
    // Status persetujuan
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
    },
    // Diisi oleh admin saat approve/reject
    reviewedBy: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'reviewed_by',
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
    },
    // Catatan admin (opsional, terutama untuk penolakan)
    reviewNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'review_note',
    },
    // Referensi ke user yang dibuat setelah approve
    createdUserId: {
        type: DataTypes.STRING(30),
        allowNull: true,
        field: 'created_user_id',
    },
}, {
    tableName: 'registration_requests',
})

module.exports = RegistrationRequest