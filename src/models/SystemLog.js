const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const SystemLog = sequelize.define('system_logs', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  // level: info | warn | error
  level: {
    type: DataTypes.ENUM('info', 'warn', 'error'),
    allowNull: false,
    defaultValue: 'info',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'system_logs',
  // Hanya pakai created_at, tidak perlu updated_at
  updatedAt: false,
})

module.exports = SystemLog
