const nodemailer = require("nodemailer");
const Patient = require("../models/patient.model");
const User = require("../models/user.model");
const { getOrCreatePatientProfile } = require("../utils/patientProfile");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function syncLegacyEmergencyContact(patient) {
  const list = Array.isArray(patient.emergencyContacts) ? patient.emergencyContacts : [];
  const primary = list.find((c) => c.isPrimary) || list[0];

  if (!primary) {
    patient.emergencyContact = {
      name: "N/A",
      relation: "N/A",
      phone: "N/A",
    };
    return;
  }

  patient.emergencyContact = {
    name: primary.name || "N/A",
    relation: primary.relation || "N/A",
    phone: primary.phone || "N/A",
  };
}

function sanitizeText(value) {
  return String(value || "").trim();
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)[0];

  const rawIp = forwarded || req.ip || req.socket?.remoteAddress || "";
  return String(rawIp || "").replace("::ffff:", "") || "N/A";
}

async function getEmergencyContacts(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    return res.status(200).json({
      contacts: patient.emergencyContacts || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function addEmergencyContact(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    const name = sanitizeText(req.body.name);
    const relation = sanitizeText(req.body.relation);
    const phone = sanitizeText(req.body.phone);
    const email = sanitizeText(req.body.email);
    const requestedPrimary = Boolean(req.body.isPrimary);

    if (!name || !relation || !phone || !email) {
      return res.status(400).json({ error: "Name, relation, phone and email are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    const hasAnyContact = (patient.emergencyContacts || []).length > 0;
    const isPrimary = requestedPrimary || !hasAnyContact;

    if (isPrimary) {
      patient.emergencyContacts.forEach((contact) => {
        contact.isPrimary = false;
      });
    }

    patient.emergencyContacts.push({
      name,
      relation,
      phone,
      email,
      isPrimary,
    });

    syncLegacyEmergencyContact(patient);
    await patient.save();

    return res.status(201).json({
      message: "Emergency contact added successfully",
      contacts: patient.emergencyContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function deleteEmergencyContact(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    const contactId = req.params.id;
    const contact = patient.emergencyContacts.id(contactId);
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const wasPrimary = contact.isPrimary;
    contact.deleteOne();

    if (wasPrimary && patient.emergencyContacts.length > 0) {
      patient.emergencyContacts[0].isPrimary = true;
    }

    syncLegacyEmergencyContact(patient);
    await patient.save();

    return res.status(200).json({
      message: "Emergency contact deleted successfully",
      contacts: patient.emergencyContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function setPrimaryEmergencyContact(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    const contactId = req.params.id;
    const contact = patient.emergencyContacts.id(contactId);
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    patient.emergencyContacts.forEach((item) => {
      item.isPrimary = item._id.toString() === contactId;
    });

    syncLegacyEmergencyContact(patient);
    await patient.save();

    return res.status(200).json({
      message: "Primary contact updated successfully",
      contacts: patient.emergencyContacts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    if (host) {
      return {
        transporter: nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        }),
        from: process.env.SMTP_FROM || user,
        mode: "smtp",
      };
    }

    return {
      transporter: nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: { user, pass },
      }),
      from: process.env.SMTP_FROM || user,
      mode: "smtp",
    };
  }

  // Fallback for local/dev setups where SMTP credentials are unavailable.
  if (String(process.env.ENABLE_SENDMAIL_FALLBACK || "true") === "true") {
    return {
      transporter: nodemailer.createTransport({
        sendmail: true,
        newline: "unix",
        path: process.env.SENDMAIL_PATH || "/usr/sbin/sendmail",
      }),
      from: process.env.SENDMAIL_FROM || "no-reply@qure.local",
      mode: "sendmail",
    };
  }

  return null;
}

async function sendEmergencyEmail(req, res) {
  try {
    const patient = await getOrCreatePatientProfile(req.userId);

    const user = await User.findById(req.userId).select("fullName email phone");
    if (!user) return res.status(404).json({ error: "User not found" });

    const contact = (patient.emergencyContacts || []).find((c) => c.isPrimary) || patient.emergencyContacts?.[0];
    if (!contact || !contact.email || contact.email === "N/A") {
      return res.status(400).json({ error: "No emergency contact with valid email found" });
    }

    const mailClient = buildTransporter();
    if (!mailClient || !mailClient.transporter) {
      return res.status(500).json({
        error: "Email service is not configured. Set SMTP_* or EMAIL_* in backend .env",
      });
    }

    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const mapLink =
      latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : "Location unavailable";

    const subject = `Emergency Alert: ${user.fullName || "Patient"}`;

    const html = `
      <h2>Emergency Alert from Qure</h2>
      <p><strong>Patient:</strong> ${user.fullName || "N/A"}</p>
      <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
      <p><strong>Email:</strong> ${user.email || "N/A"}</p>
      <p><strong>Primary Contact Relation:</strong> ${contact.relation || "N/A"}</p>
      <p><strong>Reported Location:</strong> ${mapLink}</p>
      <p>Please check on the patient immediately.</p>
    `;

    await mailClient.transporter.sendMail({
      from: mailClient.from,
      to: contact.email,
      subject,
      html,
    });

    const emergencyLogEntry = {
      triggeredAt: new Date(),
      deliveryMode: mailClient.mode || "unknown",
      targetEmail: contact.email || "N/A",
      sourceIp: getClientIp(req),
    };

    // Use an atomic update to avoid VersionError when reports/emergency updates happen together.
    await Patient.updateOne(
      { _id: patient._id },
      {
        $push: {
          emergencyTriggerLogs: {
            $each: [emergencyLogEntry],
            $slice: -200,
          },
        },
      }
    );

    return res.status(200).json({
      message:
        mailClient.mode === "smtp"
          ? "Emergency email sent successfully"
          : "Emergency email sent via local sendmail fallback",
      mode: mailClient.mode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error:
        "Failed to send emergency email. Configure SMTP_* env vars in backend .env for reliable delivery.",
    });
  }
}

module.exports = {
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  setPrimaryEmergencyContact,
  sendEmergencyEmail,
};
