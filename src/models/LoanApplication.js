const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const LoanApplication = sequelize.define('loan_applications', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  memberId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'member_id',
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tenorMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tenor_months',
  },
  collateral: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Tidak ada',
  },
  // status: pending | approved | rejected
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'admin_notes',
  },
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
}, {
  tableName: 'loan_applications',
})

module.exports = LoanApplication
