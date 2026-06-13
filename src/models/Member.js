const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Member = sequelize.define('members', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'user_id',
  },
  memberNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'member_number',
  },
  birthPlaceAndDate: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'birth_place_and_date',
  },
  nik: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  joinDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'join_date',
  },
  // status: active | inactive
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  // Pengunduran diri
  resignationStatus: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'none',
    field: 'resignation_status',
  },
  resignationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resignation_reason',
  },
  resignationRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resignation_requested_at',
  },
  resignationReviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'resignation_reviewed_at',
  },
  resignationReviewedBy: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'resignation_reviewed_by',
  },
  resignationNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'resignation_notes',
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
}, {
  tableName: 'members',
})

module.exports = Member
