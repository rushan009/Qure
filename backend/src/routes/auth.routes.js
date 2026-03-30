const express = require('express');
const router = express.Router()
const authcontroller = require('../controllers/auth.controller');
const authenticateJWT = require('../middlewares/authenticateJWT')
const getProfile = require('../controllers/profile.controller')
const updateProfile = require("../controllers/updateProfile.controller");
const {addMedication, getMedications, deleteMedication} = require("../controllers/medication.controller");

router.post('/register', authcontroller.register);
router.post('/login', authcontroller.login);
router.get("/profile", authenticateJWT, getProfile);
router.put("/profile", authenticateJWT, updateProfile);


//medicine
router.post("/medication", authenticateJWT, addMedication);
router.get("/medication", authenticateJWT, getMedications);
router.delete("/medication/:id", authenticateJWT, deleteMedication);

module.exports = router;