const Patient = require("../models/patient.model");
const User = require("../models/user.model");
const Doctor = require("../models/doctor.model");
const fs = require("fs");
const path = require("path");
const { getOrCreatePatientProfile } = require("../utils/patientProfile");

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];

  const rawIp = forwarded || req.ip || req.socket?.remoteAddress || "";
  return String(rawIp || "").replace("::ffff:", "") || "N/A";
}

function toSafeFileName(fileName) {
  return String(fileName || "report")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildLimitedPayload(patient) {
  const contacts = Array.isArray(patient?.emergencyContacts) ? patient.emergencyContacts : [];
  const allergies = Array.isArray(patient?.allergies) ? patient.allergies : [];

  return {
    _id: patient?._id,
    user: {
      _id: patient?.user?._id || null,
      fullName: patient?.user?.fullName || "N/A",
      email: patient?.user?.email || "N/A",
      phone: patient?.user?.phone || "N/A",
      role: patient?.user?.role || "patient",
    },
    dob: patient?.dob || null,
    gender: patient?.gender || "N/A",
    bloodGroup: patient?.bloodGroup || "N/A",
    height: patient?.height || null,
    weight: patient?.weight || null,
    address: patient?.address || "N/A",
    emergencyContact: patient?.emergencyContact || null,
    emergencyContacts: contacts,
    allergies,
    lastVitals: patient?.lastVitals || {},
    accessScope: "limited",
  };
}


const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate({
      path: "user",
      select: "fullName email phone role",
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const scannerUserId = String(req.userId || "").trim();
    const patientOwnerUserId = String(patient?.user?._id || "").trim();
    const sourceIp = getClientIp(req);
    let accessScope = "limited";

    if (scannerUserId && scannerUserId === patientOwnerUserId) {
      accessScope = "self";
    }

    if (scannerUserId && scannerUserId !== patientOwnerUserId) {
      const scannerUser = await User.findById(scannerUserId).select("fullName role");

      if (scannerUser) {
        const scannerRole = scannerUser.role === "doctor" ? "doctor" : "patient";
        let isVerifiedDoctor = false;
        let scannerSpecialization = "N/A";

        if (scannerRole === "doctor") {
          const doctor = await Doctor.findOne({ user: scannerUserId }).select(
            "specialization isNmcVerified"
          );
          scannerSpecialization = doctor?.specialization || "N/A";
          isVerifiedDoctor = Boolean(doctor?.isNmcVerified);
        }

        accessScope = scannerRole === "doctor" && isVerifiedDoctor ? "full" : "limited";

        const now = Date.now();
        const latestBySameScanner = [...(patient.qrAccessLogs || [])]
          .reverse()
          .find((log) => String(log?.scannerUser || "") === scannerUserId);

        const isDuplicateWithinWindow =
          latestBySameScanner?.scannedAt &&
          now - new Date(latestBySameScanner.scannedAt).getTime() < 60 * 1000;

        if (!isDuplicateWithinWindow) {
          const logEntry = {
            scannerUser: scannerUser._id,
            scannerName: scannerUser.fullName || "Unknown User",
            scannerRole,
            scannerSpecialization,
            accessLevel: scannerRole === "doctor" && isVerifiedDoctor ? "full" : "limited",
            scannedAt: new Date(),
            sourceIp,
          };

          await Patient.updateOne(
            { _id: patient._id },
            {
              $push: {
                qrAccessLogs: {
                  $each: [logEntry],
                  $slice: -200,
                },
              },
            }
          );
        }
      }
    }

    if (accessScope === "full" || accessScope === "self") {
      const fullPayload = patient.toObject();
      fullPayload.accessScope = accessScope;
      return res.json(fullPayload);
    }

    return res.json(buildLimitedPayload(patient));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const viewPatientReportFile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate({
      path: "user",
      select: "_id",
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const requesterUserId = String(req.userId || "").trim();
    const patientOwnerUserId = String(patient?.user?._id || "").trim();

    let canView = requesterUserId && requesterUserId === patientOwnerUserId;

    if (!canView) {
      const requester = await User.findById(requesterUserId).select("role");
      if (requester?.role === "doctor") {
        const doctor = await Doctor.findOne({ user: requesterUserId }).select("isNmcVerified");
        canView = Boolean(doctor?.isNmcVerified);
      }
    }

    if (!canView) {
      return res.status(403).json({
        message: "Only NMC-verified doctors can view patient reports from scanned QR",
      });
    }

    const report = Array.isArray(patient.reports)
      ? patient.reports.id(req.params.reportId)
      : null;

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const absolutePath = path.resolve(String(report.filePath || ""));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Report file is missing on server" });
    }

    const safeName = toSafeFileName(report.originalFileName || "report");
    res.setHeader("Content-Type", report.fileMimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"`);

    return res.sendFile(absolutePath);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getMyQrAccessOverview = async (req, res) => {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    await patient.populate({
      path: "qrAccessLogs.scannerUser",
      select: "fullName role",
    });

    const logs = [...(patient.qrAccessLogs || [])].sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const scansThisMonth = logs.filter((log) => {
      const scannedAt = new Date(log.scannedAt);
      return !Number.isNaN(scannedAt.getTime()) && scannedAt >= startOfMonth;
    }).length;

    const lastLog = logs[0] || null;

    const recentAccess = logs.slice(0, 8).map((log) => {
      const scannerUser = log?.scannerUser;
      const scannerName = scannerUser?.fullName || log?.scannerName || "Unknown User";
      const scannerRole = scannerUser?.role || log?.scannerRole || "unknown";

      return {
        id: log?._id,
        scannerName,
        scannerRole,
        scannerSpecialization: log?.scannerSpecialization || "N/A",
        accessLevel: log?.accessLevel || "limited",
        scannedAt: log?.scannedAt || null,
      };
    });

    return res.json({
      summary: {
        scansThisMonth,
        totalScans: logs.length,
        lastScannedAt: lastLog?.scannedAt || null,
        lastScannerName:
          lastLog?.scannerUser?.fullName || lastLog?.scannerName || "No scans yet",
        lastScannerRole:
          lastLog?.scannerUser?.role || lastLog?.scannerRole || "unknown",
      },
      recentAccess,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getPatientById,
  getMyQrAccessOverview,
  viewPatientReportFile,
};