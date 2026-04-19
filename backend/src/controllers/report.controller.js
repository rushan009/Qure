const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const Patient = require("../models/patient.model");
const { getOrCreatePatientProfile } = require("../utils/patientProfile");

const REPORT_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/reports");

if (!fs.existsSync(REPORT_UPLOAD_DIR)) {
  fs.mkdirSync(REPORT_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function cleanFileName(fileName) {
  const raw = String(fileName || "report").trim();
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, REPORT_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const safeName = cleanFileName(file?.originalname || "report");
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${safeName}`);
  },
});

function fileFilter(_req, file, cb) {
  const ok = ALLOWED_MIME_TYPES.has(String(file?.mimetype || "").toLowerCase());

  if (!ok) {
    cb(
      new Error(
        "Unsupported file type. Upload PDF, JPG, PNG, WEBP, DOC or DOCX files only."
      )
    );
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function uploadReportFile(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err?.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File too large. Max file size is 10MB" });
      return;
    }

    res.status(400).json({ error: err?.message || "Invalid file upload" });
  });
}

function sanitizeText(value) {
  return String(value || "").trim();
}

async function getPatientByUserId(userId) {
  return getOrCreatePatientProfile(userId);
}

function sortReportsNewestFirst(reports) {
  return [...reports].sort((a, b) => {
    const aTime = new Date(a?.reportDate || a?.uploadedAt || 0).getTime();
    const bTime = new Date(b?.reportDate || b?.uploadedAt || 0).getTime();
    return bTime - aTime;
  });
}

async function getReports(req, res) {
  try {
    const patient = await getPatientByUserId(req.userId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const reports = sortReportsNewestFirst(Array.isArray(patient.reports) ? patient.reports : []).map(
      (report) => ({
        id: report?._id,
        title: report?.title || "N/A",
        category: report?.category || "General",
        reportDate: report?.reportDate || null,
        doctorName: report?.doctorName || "N/A",
        hospitalName: report?.hospitalName || "N/A",
        notes: report?.notes || "",
        originalFileName: report?.originalFileName || "report",
        fileMimeType: report?.fileMimeType || "application/octet-stream",
        fileSize: Number(report?.fileSize || 0),
        uploadedAt: report?.uploadedAt || null,
      })
    );

    return res.status(200).json({
      summary: {
        totalReports: reports.length,
      },
      reports,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function uploadReport(req, res) {
  try {
    const title = sanitizeText(req.body.title);
    const category = sanitizeText(req.body.category);
    const reportDate = sanitizeText(req.body.reportDate);
    const doctorName = sanitizeText(req.body.doctorName);
    const hospitalName = sanitizeText(req.body.hospitalName);
    const notes = sanitizeText(req.body.notes);

    if (!title || !category || !reportDate || !doctorName || !hospitalName) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        error: "Title, category, report date, doctor name and hospital name are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Report file is required" });
    }

    const parsedReportDate = new Date(reportDate);
    if (Number.isNaN(parsedReportDate.getTime())) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: "Invalid report date" });
    }

    const newReport = {
      _id: new mongoose.Types.ObjectId(),
      title,
      category,
      reportDate: parsedReportDate,
      doctorName,
      hospitalName,
      notes,
      originalFileName: req.file.originalname || "report",
      storedFileName: req.file.filename || "report",
      fileMimeType: req.file.mimetype || "application/octet-stream",
      fileSize: Number(req.file.size || 0),
      filePath: req.file.path,
      uploadedAt: new Date(),
    };

    const patient = await getPatientByUserId(req.userId);

    // Use atomic $push + $slice to avoid VersionError under concurrent writes.
    const updateResult = await Patient.updateOne(
      { _id: patient._id },
      {
        $push: {
          reports: {
            $each: [newReport],
            $slice: -500,
          },
        },
      }
    );

    if (!updateResult?.matchedCount) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(201).json({
      message: "Report uploaded successfully",
      report: {
        id: newReport._id,
        title: newReport.title,
        category: newReport.category,
        reportDate: newReport.reportDate,
        doctorName: newReport.doctorName,
        hospitalName: newReport.hospitalName,
        notes: newReport.notes,
        originalFileName: newReport.originalFileName,
        fileMimeType: newReport.fileMimeType,
        fileSize: newReport.fileSize,
        uploadedAt: newReport.uploadedAt,
      },
    });
  } catch (err) {
    console.error(err);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Max file size is 10MB" });
    }

    return res.status(500).json({ error: err?.message || "Something went wrong" });
  }
}

function findReport(patient, reportId) {
  if (!patient || !Array.isArray(patient.reports)) return null;
  return patient.reports.id(reportId);
}

async function viewReport(req, res) {
  try {
    const patient = await getPatientByUserId(req.userId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const report = findReport(patient, req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const absolutePath = path.resolve(String(report.filePath || ""));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Report file is missing on server" });
    }

    const safeFileName = cleanFileName(report.originalFileName || "report");
    res.setHeader("Content-Type", report.fileMimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);

    return res.sendFile(absolutePath);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

async function downloadReport(req, res) {
  try {
    const patient = await getPatientByUserId(req.userId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const report = findReport(patient, req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const absolutePath = path.resolve(String(report.filePath || ""));
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "Report file is missing on server" });
    }

    const safeFileName = cleanFileName(report.originalFileName || "report");
    return res.download(absolutePath, safeFileName);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  uploadReportFile,
  getReports,
  uploadReport,
  viewReport,
  downloadReport,
};
