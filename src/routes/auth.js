const router = require('express').Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middlewares/auth')

// Public
router.post('/login', authController.login)

// Protected — butuh token valid
router.post('/logout',          authenticate, authController.logout)
router.get('/me',               authenticate, authController.me)
router.post('/change-password', authenticate, authController.changePassword)

module.exports = router