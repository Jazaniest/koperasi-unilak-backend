const sequelize = require('../config/database')
const User = require('./User')
const Member = require('./Member')
const Saving = require('./Saving')
const Loan = require('./Loan')
const LoanApplication = require('./LoanApplication')
const LoanPayment = require('./LoanPayment')
const SystemLog = require('./SystemLog')
const RegistrationRequest = require('./RegistrationRequest')
const News = require('./News')

// ── Associations ──────────────────────────────────────────────────────────────

// User <-> Member (one-to-one)
User.hasOne(Member, { foreignKey: 'user_id', as: 'member', onDelete: 'RESTRICT' })
Member.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// Member -> Savings (one-to-many)
Member.hasMany(Saving, { foreignKey: 'member_id', as: 'savings', onDelete: 'CASCADE' })
Saving.belongsTo(Member, { foreignKey: 'member_id', as: 'member' })

// Member -> Loans (one-to-many)
Member.hasMany(Loan, { foreignKey: 'member_id', as: 'loans', onDelete: 'RESTRICT' })
Loan.belongsTo(Member, { foreignKey: 'member_id', as: 'member' })

// Member -> LoanApplications (one-to-many)
Member.hasMany(LoanApplication, { foreignKey: 'member_id', as: 'loanApplications', onDelete: 'RESTRICT' })
LoanApplication.belongsTo(Member, { foreignKey: 'member_id', as: 'member' })

// Loan -> LoanPayments (one-to-many)
Loan.hasMany(LoanPayment, { foreignKey: 'loan_id', as: 'payments', onDelete: 'CASCADE' })
LoanPayment.belongsTo(Loan, { foreignKey: 'loan_id', as: 'loan' })

// User sebagai reviewer pengajuan
User.hasMany(LoanApplication, { foreignKey: 'reviewed_by', as: 'reviewedApplications', onDelete: 'SET NULL' })
LoanApplication.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' })

User.hasMany(RegistrationRequest, { foreignKey: 'reviewed_by', as: 'reviewedRegistrations', onDelete: 'SET NULL' })
RegistrationRequest.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' })

User.hasMany(News, { foreignKey: 'created_by', as: 'news', onDelete: 'RESTRICT' })
News.belongsTo(User, { foreignKey: 'created_by', as: 'author' })

// LoanPayment → Loan
// LoanPayment.belongsTo(Loan, { foreignKey: 'loan_id', as: 'loan' })
// Loan.hasMany(LoanPayment, { foreignKey: 'loan_id', as: 'payments' })

// Saving → Member
// Saving.belongsTo(Member, { foreignKey: 'member_id', as: 'member' })

// LoanApplication → Member (jika belum ada)
// LoanApplication.belongsTo(Member, { foreignKey: 'member_id', as: 'member' })

module.exports = {
  sequelize,
  User,
  Member,
  Saving,
  Loan,
  LoanApplication,
  LoanPayment,
  SystemLog,
  RegistrationRequest,
  News,
}