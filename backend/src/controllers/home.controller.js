const User = require("../models/user.model");
const { getOrCreatePatientProfile } = require("../utils/patientProfile");

function formatTimeAgo(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return "just now";

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

function safeName(value, fallback = "N/A") {
  const text = String(value || "").trim();
  return text || fallback;
}

function buildPatientCode(patientId, fullName) {
  const suffix = String(patientId || "").slice(-4).toUpperCase();
  const initials = String(fullName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `QR-${suffix || "0000"}-${initials || "PT"}`;
}

async function getHomeSummary(req, res) {
  try {
    const [user, patient] = await Promise.all([
      User.findById(req.userId).select("fullName role"),
      getOrCreatePatientProfile(req.userId),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const diseases = Array.isArray(patient.diseases) ? patient.diseases : [];
    const activeConditions = diseases.filter(
      (disease) => String(disease?.status || "").toLowerCase() !== "resolved"
    );

    const medications = Array.isArray(patient.generalMedications)
      ? patient.generalMedications
      : [];

    const reports = Array.isArray(patient.reports) ? patient.reports : [];

    const qrAccessLogs = Array.isArray(patient.qrAccessLogs) ? patient.qrAccessLogs : [];
    const emergencyTriggerLogs = Array.isArray(patient.emergencyTriggerLogs)
      ? patient.emergencyTriggerLogs
      : [];

    const allergies = Array.isArray(patient.allergies) ? patient.allergies : [];

    const primaryEmergency =
      (Array.isArray(patient.emergencyContacts)
        ? patient.emergencyContacts.find((contact) => contact.isPrimary)
        : null) ||
      (Array.isArray(patient.emergencyContacts) ? patient.emergencyContacts[0] : null) ||
      patient.emergencyContact ||
      null;

    const criticalAllergies = allergies.length
      ? allergies
          .filter((a) => safeName(a?.name, "") !== "")
          .slice(0, 3)
          .map((a) => safeName(a?.name))
          .join(", ")
      : "N/A";

    const keyConditions = activeConditions.length
      ? activeConditions
          .slice(0, 3)
          .map((disease) => safeName(disease?.name))
          .join(", ")
      : "N/A";

    const emergencyContactSummary = primaryEmergency
      ? `${safeName(primaryEmergency?.name)}${
          safeName(primaryEmergency?.relation, "") !== ""
            ? ` (${safeName(primaryEmergency?.relation)})`
            : ""
        }`
      : "N/A";

    const accessActivity = qrAccessLogs.map((log) => ({
      id: String(log?._id || ""),
      title: `QR scanned by ${safeName(log?.scannerName, "someone")}`,
      subtitle:
        String(log?.scannerRole || "").toLowerCase() === "doctor"
          ? safeName(log?.scannerSpecialization, "Doctor")
          : "Patient",
      occurredAt: log?.scannedAt || null,
      tone: "info",
    }));

    const emergencyActivity = emergencyTriggerLogs.map((log) => ({
      id: String(log?._id || ""),
      title: "Emergency alert sent",
      subtitle: `To ${safeName(log?.targetEmail, "primary contact")}`,
      occurredAt: log?.triggeredAt || null,
      tone: "danger",
    }));

    const diseaseActivity = diseases
      .filter((disease) => disease?.diagnosisDate)
      .map((disease) => ({
        id: String(disease?._id || ""),
        title: `Condition logged: ${safeName(disease?.name)}`,
        subtitle: `By ${safeName(disease?.doctorName, "doctor")}`,
        occurredAt: disease?.diagnosisDate || null,
        tone: "warning",
      }));

    const recentActivity = [...accessActivity, ...emergencyActivity, ...diseaseActivity]
      .filter((item) => item.occurredAt)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 6)
      .map((item) => ({
        ...item,
        timeAgo: formatTimeAgo(item.occurredAt),
      }));

    return res.status(200).json({
      greetingName: safeName(user.fullName, "Patient"),
      stats: {
        activeConditions: activeConditions.length,
        medications: medications.length,
        reports: reports.length,
        accessLogs: qrAccessLogs.length,
      },
      profileSummary: {
        bloodGroup: safeName(patient.bloodGroup),
        criticalAllergies,
        keyConditions,
        emergencyContact: emergencyContactSummary,
      },
      qr: {
        patientCode: buildPatientCode(patient._id, user.fullName),
      },
      recentActivity,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getHomeSummary,
};
