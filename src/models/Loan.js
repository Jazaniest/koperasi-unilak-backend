const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Loan = sequelize.define('loans', {
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
  remaining: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'interest_rate',
  },
  tenorMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'tenor_months',
  },
  monthlyPayment: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'monthly_payment',
  },
  // status: active | lunas
  status: {
    type: DataTypes.ENUM('active', 'lunas'),
    allowNull: false,
    defaultValue: 'active',
  },
  purpose: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  approvedBy: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'approved_by',
  },
  settledAt: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'settled_at',
  },
  settledBy: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'settled_by',
  },
}, {
  tableName: 'loans',
})

module.exports = Loan
