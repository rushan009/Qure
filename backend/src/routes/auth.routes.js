const express = require('express');
const router = express.Router()
const authcontroller = require('../controllers/auth.controller');
const authenticateJWT = require('../middlewares/authenticateJWT')
const getProfile = require('../controllers/profile.controller')
const updateProfile = require("../controllers/updateProfile.controller");
const {addMedication, getMedications, deleteMedication} = require("../controllers/medication.controller");
const { addDisease, getDiseases, updateDisease, deleteDisease } = require("../controllers/disease.controller");
const { addAllergy, deleteAllergy, updateLastVitals } = require("../controllers/medical.controller");
const {
	getEmergencyContacts,
	addEmergencyContact,
	deleteEmergencyContact,
	setPrimaryEmergencyContact,
	sendEmergencyEmail,
} = require("../controllers/emergency.controller");
const {
	getPatientById,
	getMyQrAccessOverview,
	viewPatientReportFile,
} = require("../controllers/viewReport.controller");
const { getMyAccessLogs } = require("../controllers/accessLog.controller");
const { getHomeSummary } = require("../controllers/home.controller");
const {
	uploadReportFile,
	getReports,
	uploadReport,
	viewReport,
	downloadReport,
} = require("../controllers/report.controller");
const {
	getDoctorDashboardSummary,
	getDoctorScannedPatients,
} = require("../controllers/doctorDashboard.controller");
const {
	uploadDoctorLicenseImage,
	getDoctorLicenseStatus,
	updateDoctorLicense,
	verifyDoctorLicense,
	deleteDoctorLicense,
} = require("../controllers/doctorLicense.controller");

router.post('/register', authcontroller.register);
router.post('/login', authcontroller.login);
router.post('/logout', authcontroller.logout);
router.get("/profile", authenticateJWT, getProfile);
router.put("/profile", authenticateJWT, updateProfile);



router.get("/patients/:id", authenticateJWT, getPatientById);
router.get("/patients/:id/reports/:reportId/view", authenticateJWT, viewPatientReportFile);
router.get("/qr-access-overview", authenticateJWT, getMyQrAccessOverview);
router.get("/access-logs", authenticateJWT, getMyAccessLogs);
router.get("/home-summary", authenticateJWT, getHomeSummary);

// doctor dashboard
router.get("/doctor/dashboard-summary", authenticateJWT, getDoctorDashboardSummary);
router.get("/doctor/scanned-patients", authenticateJWT, getDoctorScannedPatients);
router.get("/doctor/license-status", authenticateJWT, getDoctorLicenseStatus);
router.post("/doctor/license", authenticateJWT, uploadDoctorLicenseImage, updateDoctorLicense);
router.post("/doctor/license/verify", authenticateJWT, verifyDoctorLicense);
router.delete("/doctor/license", authenticateJWT, deleteDoctorLicense);

// reports
router.get("/reports", authenticateJWT, getReports);
router.post("/reports", authenticateJWT, uploadReportFile, uploadReport);
router.get("/reports/:id/view", authenticateJWT, viewReport);
router.get("/reports/:id/download", authenticateJWT, downloadReport);


//medicine
router.post("/medication", authenticateJWT, addMedication);
router.get("/medication", authenticateJWT, getMedications);
router.delete("/medication/:id", authenticateJWT, deleteMedication);

// disease
router.post("/disease", authenticateJWT, addDisease);
router.get("/disease", authenticateJWT, getDiseases);
router.put("/disease/:id", authenticateJWT, updateDisease);
router.delete("/disease/:id", authenticateJWT, deleteDisease);

// medical summary
router.post("/allergy", authenticateJWT, addAllergy);
router.delete("/allergy/:id", authenticateJWT, deleteAllergy);
router.put("/vitals", authenticateJWT, updateLastVitals);

// emergency
router.get("/emergency-contacts", authenticateJWT, getEmergencyContacts);
router.post("/emergency-contacts", authenticateJWT, addEmergencyContact);
router.delete("/emergency-contacts/:id", authenticateJWT, deleteEmergencyContact);
router.put("/emergency-contacts/:id/primary", authenticateJWT, setPrimaryEmergencyContact);
router.post("/emergency/send-email", authenticateJWT, sendEmergencyEmail);

module.exports = router;