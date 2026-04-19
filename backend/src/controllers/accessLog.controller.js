const { getOrCreatePatientProfile } = require("../utils/patientProfile");

function maskIp(ip) {
  const value = String(ip || "").replace("::ffff:", "").trim();
  if (!value || value === "N/A") return "N/A";

  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  }

  if (value.includes(":")) {
    const parts = value.split(":").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}:****`;
    }
  }

  return "N/A";
}

function buildAccessSections(accessLevel) {
  if (accessLevel === "full") {
    return ["Full History", "Medications", "Reports"];
  }

  return ["Basic Profile", "Allergies"];
}

async function getMyAccessLogs(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    const qrLogs = Array.isArray(patient.qrAccessLogs) ? patient.qrAccessLogs : [];
    const emergencyLogs = Array.isArray(patient.emergencyTriggerLogs)
      ? patient.emergencyTriggerLogs
      : [];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthAccessCount = qrLogs.filter((log) => {
      const date = new Date(log.scannedAt);
      return !Number.isNaN(date.getTime()) && date >= startOfMonth;
    }).length;

    const accessEvents = qrLogs.map((log) => {
      const role = String(log?.scannerRole || "unknown").toLowerCase();
      const isDoctor = role === "doctor";
      const badge = log?.accessLevel === "full" ? "Direct Access" : "QR Scan";

      return {
        id: String(log?._id || ""),
        type: "access",
        name: log?.scannerName || "Unknown User",
        subtitle: isDoctor
          ? `${log?.scannerSpecialization || "Healthcare Provider"}`
          : "Patient",
        badge,
        sections: buildAccessSections(log?.accessLevel),
        happenedAt: log?.scannedAt || null,
        durationMinutes: null,
        ipMasked: maskIp(log?.sourceIp),
      };
    });

    const emergencyEvents = emergencyLogs.map((log) => ({
      id: String(log?._id || ""),
      type: "emergency",
      name: "Emergency Alert",
      subtitle: `Sent to ${log?.targetEmail || "primary contact"}`,
      badge: "Emergency",
      sections: ["Emergency Profile", "Location"],
      happenedAt: log?.triggeredAt || null,
      durationMinutes: null,
      ipMasked: maskIp(log?.sourceIp),
    }));

    const logs = [...accessEvents, ...emergencyEvents].sort(
      (a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime()
    );

    return res.status(200).json({
      summary: {
        totalAccesses: qrLogs.length,
        thisMonth: thisMonthAccessCount,
        emergencyTriggered: emergencyLogs.length,
      },
      logs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getMyAccessLogs,
};
