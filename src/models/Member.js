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
