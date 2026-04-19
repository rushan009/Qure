const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");
const User = require("../models/user.model");
const { getDoctorVerificationState } = require("../utils/doctorVerification");

function sameUserId(value, expected) {
  return String(value || "") === String(expected || "");
}

function buildRecentLogs(patients, doctorUserId) {
  const rows = [];

  patients.forEach((patient) => {
    const patientUser = patient?.user || null;
    const logs = Array.isArray(patient?.qrAccessLogs) ? patient.qrAccessLogs : [];

    logs.forEach((log) => {
      if (!sameUserId(log?.scannerUser, doctorUserId)) return;

      rows.push({
        id: String(log?._id || ""),
        patientId: String(patient?._id || ""),
        patientName: patientUser?.fullName || "Unknown Patient",
        patientEmail: patientUser?.email || "N/A",
        patientPhone: patientUser?.phone || "N/A",
        bloodGroup: patient?.bloodGroup || "N/A",
        action: log?.accessLevel === "full" ? "Viewed full report" : "Viewed limited report",
        scannedAt: log?.scannedAt || null,
      });
    });
  });

  return rows.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
}

function buildScannedPatientRows(patients, doctorUserId) {
  return patients
    .map((patient) => {
      const logs = Array.isArray(patient?.qrAccessLogs)
        ? patient.qrAccessLogs.filter((log) => sameUserId(log?.scannerUser, doctorUserId))
        : [];

      if (!logs.length) return null;

      const sorted = [...logs].sort(
        (a, b) => new Date(b?.scannedAt).getTime() - new Date(a?.scannedAt).getTime()
      );

      return {
        patientId: String(patient?._id || ""),
        patientName: patient?.user?.fullName || "Unknown Patient",
        patientEmail: patient?.user?.email || "N/A",
        patientPhone: patient?.user?.phone || "N/A",
        bloodGroup: patient?.bloodGroup || "N/A",
        totalChecks: logs.length,
        lastCheckedAt: sorted[0]?.scannedAt || null,
        lastAccessLevel: sorted[0]?.accessLevel || "limited",
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime());
}

async function getDoctorDashboardSummary(req, res) {
  try {
    const [user, doctor, patients] = await Promise.all([
      User.findById(req.userId).select("fullName email phone role"),
      Doctor.findOne({ user: req.userId }).select(
        "specialization liscenceNumber liscenceImage isNmcVerified licenseVerificationStatus extractedNmcNumber verificationConfidence verificationSource verificationFailureReason verificationLastCheckedAt verifiedAt"
      ),
      Patient.find({ "qrAccessLogs.scannerUser": req.userId })
        .populate({ path: "user", select: "fullName email phone" })
        .select("user bloodGroup qrAccessLogs"),
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(403).json({ error: "Only doctor role can access doctor dashboard" });
    }

    const recentLogs = buildRecentLogs(patients, req.userId);
    const scannedPatients = buildScannedPatientRows(patients, req.userId);
    const verificationState = getDoctorVerificationState(doctor);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthChecks = recentLogs.filter((item) => {
      const date = new Date(item.scannedAt);
      return !Number.isNaN(date.getTime()) && date >= startOfMonth;
    }).length;

    return res.status(200).json({
      doctorProfile: {
        fullName: user.fullName || "N/A",
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        specialization: doctor?.specialization || "N/A",
        liscenceNumber:
          doctor?.liscenceNumber !== undefined && doctor?.liscenceNumber !== null
            ? String(doctor.liscenceNumber)
            : "N/A",
        ...verificationState,
      },
      summary: {
        patientsAttendedTillDate: scannedPatients.length,
        totalChecks: recentLogs.length,
        checksThisMonth: thisMonthChecks,
      },
      patientPreview: scannedPatients.slice(0, 6),
      recentLogs: recentLogs.slice(0, 12),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function getDoctorScannedPatients(req, res) {
  try {
    const user = await User.findById(req.userId).select("role");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(403).json({ error: "Only doctor role can access this page" });
    }

    const patients = await Patient.find({ "qrAccessLogs.scannerUser": req.userId })
      .populate({ path: "user", select: "fullName email phone" })
      .select("user bloodGroup qrAccessLogs");

    const scannedPatients = buildScannedPatientRows(patients, req.userId);

    return res.status(200).json({
      total: scannedPatients.length,
      patients: scannedPatients,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  getDoctorDashboardSummary,
  getDoctorScannedPatients,
};
