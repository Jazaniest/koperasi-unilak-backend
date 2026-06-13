const router = require('express').Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middlewares/auth')

// Public
router.post('/login', authController.login)

// Protected — butuh token valid
router.post('/logout',          authenticate, authController.logout)
router.get('/me',               authenticate, authController.me)
router.post('/change-password', authenticate, authController.changePassword)

// Member profile — hanya untuk role 'user'
router.get('/me/member',        authenticate, authController.getMemberProfile)
router.put('/me/profile',       authenticate, authController.updateProfile)

module.exports = router