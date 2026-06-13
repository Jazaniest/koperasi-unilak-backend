const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('users', {
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // role: super_admin | admin | bendahara | user
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'bendahara', 'user'),
    allowNull: false,
    defaultValue: 'user',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  // Hanya diisi jika role = 'user' (anggota)
  memberId: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'member_id',
  },
}, {
  tableName: 'users',
})

module.exports = User
