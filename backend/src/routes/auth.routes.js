const express = require('express');
const router = express.Router()
const authcontroller = require('../controllers/auth.controller');
const authenticateJWT = require('../middlewares/authenticateJWT')
const getProfile = require('../controllers/profile.controller')


router.post('/register', authcontroller.register);
router.post('/login', authcontroller.login);
router.get("/profile", authenticateJWT, getProfile);

module.exports = router;