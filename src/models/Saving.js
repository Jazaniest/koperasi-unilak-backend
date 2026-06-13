const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Saving = sequelize.define('savings', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  memberId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'member_id',
  },
  // type: pokok | wajib | sukarela
  type: {
    type: DataTypes.ENUM('pokok', 'wajib', 'sukarela'),
    allowNull: false,
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
}, {
  tableName: 'savings',
})

module.exports = Saving
