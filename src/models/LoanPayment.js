const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const LoanPayment = sequelize.define('loan_payments', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  loanId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'loan_id',
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  remainingAfter: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'remaining_after',
  },
}, {
  tableName: 'loan_payments',
})

module.exports = LoanPayment
