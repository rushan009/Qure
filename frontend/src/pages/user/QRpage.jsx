import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";

function extractPatientIdFromQrValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;

  if (value.startsWith("qure://patient/")) {
    return decodeURIComponent(value.replace("qure://patient/", ""));
  }

  try {
    const parsed = new URL(value);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "view-report") {
      return decodeURIComponent(parts[1]);
    }
    if (parts.length >= 2 && parts[0] === "scan") {
      return decodeURIComponent(parts[1]);
    }
  } catch {
    // Not a URL.
  }

  return null;
}

function createOneTimeScanGrant(patientId) {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  sessionStorage.setItem(
    "qure_view_report_scan_grant",
    JSON.stringify({
      patientId: String(patientId || "").trim(),
      issuedAt: Date.now(),
      nonce,
    })
  );
}

function formatTimeAgo(dateValue) {
  if (!dateValue) return "No scans yet";

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "No scans yet";

  const now = Date.now();
  const diffSeconds = Math.max(1, Math.floor((now - parsed.getTime()) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;

  return parsed.toLocaleDateString();
}

function toRoleLabel(role) {
  if (String(role || "").toLowerCase() === "doctor") return "Doctor";
  if (String(role || "").toLowerCase() === "patient") return "Patient";
  return "Unknown";
}

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

const ICONS = {
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  share:    <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  scan:     <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
  shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  eye:      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  refresh:  <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
  torch:    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  close:    <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  check:    <polyline points="20 6 9 17 4 12"/>,
  qr:       <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/></>,
  link:     <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
  copy:     <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
};

// ─── Scanner Modal ────────────────────────────────────────────────────────────
function ScannerModal({ onClose }) {
  const navigate = useNavigate();

const [scanning, setScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(true);
  const [noCamera, setNoCamera] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const activeRef = useRef(true);
  const fileInputRef = useRef(null);
  const scanFrameRef = useRef(() => {});

  // ── 1. Define stopCamera first (no external dependencies) ──
  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setTorchOn(false);
  }, []);

  // ── 2. Define the scheduler before scan logic ──
  const scheduleFrame = useCallback(() => {
    if (!activeRef.current) return;
    animRef.current = requestAnimationFrame(() => scanFrameRef.current());
  }, []);

  // ── 3. Define the logic for scanning ──
  const scanFrame = useCallback(() => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  // Note: We reference scheduleFrame here. 
  // This works because the function body isn't executed until AFTER 
  // all constants are initialized.
  if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
    scheduleFrame(); 
    return;
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) {
    scheduleFrame();
    return;
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });

  if (code?.data) {
    const detectedPatientId = extractPatientIdFromQrValue(code.data);
    stopCamera();
    setQrResult(code.data);

    if (detectedPatientId) {
      createOneTimeScanGrant(detectedPatientId);
      onClose();
      navigate(`/view-report/${encodeURIComponent(detectedPatientId)}`);
      return;
    }
  } else {
    scheduleFrame();
  }
  }, [navigate, onClose, scheduleFrame, stopCamera]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  // ── 4. Define startCamera last ──
  const startCamera = useCallback(async () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(t => t.stop());
  }
  if (animRef.current) cancelAnimationFrame(animRef.current);
  
  setQrResult(null);
  setTorchOn(false);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    });

    if (!activeRef.current) {
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    streamRef.current = stream;
    setNoCamera(false);
    setScanning(true);

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
          .then(() => scheduleFrame()) // Calls the now-defined scheduleFrame
          .catch(() => {});
      };
    }
  } catch {
    setNoCamera(true);
    setScanning(false);
  }
  }, [scheduleFrame]);

  // 5. Toggle Torch
  const handleTorchToggle = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const caps = track.getCapabilities?.() ?? {};
    if (!caps.torch) {
      setTorchSupported(false);
      return;
    }

    try {
      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  // 6. Handle Image Upload
  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      URL.revokeObjectURL(url);

      if (code) {
        stopCamera();
        setQrResult(code.data);
      } else {
        alert("No QR code found in the image.");
      }
    };
    img.src = url;
  }, [stopCamera]);

  // 7. Lifecycle
  useEffect(() => {
    activeRef.current = true;
    const initId = requestAnimationFrame(() => {
      startCamera();
    });

    return () => {
      cancelAnimationFrame(initId);
      activeRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Helpers & UI Logic
  const handleCopy = () => {
    if (qrResult) {
      navigator.clipboard?.writeText(qrResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const normalizedResult = qrResult?.trim() ?? "";
  const isUrl = /^https?:\/\//i.test(normalizedResult);
  const isPhone = /^\+?[0-9()\-\s]{7,}$/.test(normalizedResult);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedResult);
  
  return (
    <>
      <style>{`
        @keyframes laser {
          0%   { top: 4px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
        .laser-line {
          position: absolute; left: 4px; right: 4px; height: 2px; border-radius: 1px;
          background: linear-gradient(90deg, transparent, #2dd4bf, transparent);
          animation: laser 1.8s ease-in-out infinite;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-card { animation: modal-in 0.2s ease; }
        @keyframes result-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .result-card { animation: result-in 0.25s ease; }
      `}</style>

      {/* hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-card bg-white rounded-2xl w-115 max-w-[95vw] overflow-hidden shadow-2xl">

          {/* ── header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-[15px] font-semibold text-gray-900">Scan a Qure QR code</h2>
              <p className="text-xs text-gray-400 mt-0.5">Point at another patient's or doctor's QR</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <Icon d={ICONS.close} size={14} />
            </button>
          </div>

          <div className="p-5">

            {/* ── camera viewport ── */}
            <div className="relative w-full aspect-square rounded-xl bg-gray-950 overflow-hidden mb-4 flex items-center justify-center">

              {/* live video */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
                muted
                playsInline
              />

              {/* hidden processing canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* no camera state */}
              {noCamera && (
                <div className="text-center z-10 px-4">
                  <div className="text-gray-600 opacity-30 flex justify-center mb-3">
                    <Icon d={ICONS.scan} size={44} />
                  </div>
                  <p className="text-sm text-gray-400 mb-3">Camera unavailable or permission denied</p>
                  <button
                    onClick={startCamera}
                    className="text-xs bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* result overlay — shown after scan */}
              {qrResult && (
                <div className="absolute inset-0 bg-gray-950/90 flex items-center justify-center p-5 z-20">
                  <div className="result-card w-full bg-white rounded-xl p-5 shadow-xl">
                    {/* success badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                        <Icon d={ICONS.check} size={12} />
                      </span>
                      <span className="text-sm font-semibold text-gray-800">QR Code Detected</span>
                    </div>

                    {/* result text */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 mb-4">
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Result</p>
                      <p className="text-sm text-gray-800 font-medium break-all leading-relaxed">{qrResult}</p>
                    </div>

                    {/* action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* open URL */}
                      {isUrl && (
                        <button
                          onClick={() => window.open(qrResult, "_blank", "noopener,noreferrer")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-colors"
                        >
                          <Icon d={ICONS.link} size={12} />
                          Open Link
                        </button>
                      )}

                      {/* call phone */}
                      {isPhone && (
                        <a
                          href={`tel:${qrResult.trim()}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-colors"
                        >
                          Call
                        </a>
                      )}

                      {/* email */}
                      {isEmail && (
                        <a
                          href={`mailto:${qrResult.trim()}`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500 text-white text-xs font-semibold hover:bg-teal-600 transition-colors"
                        >
                          Send Email
                        </a>
                      )}

                      {/* copy */}
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Icon d={copied ? ICONS.check : ICONS.copy} size={12} />
                        {copied ? "Copied!" : "Copy"}
                      </button>

                      {/* scan again */}
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <Icon d={ICONS.refresh} size={12} />
                        Scan again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* scanning overlay (corner brackets + laser) */}
              {scanning && !qrResult && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-48 h-48">
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-teal-400 rounded-tl-md" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-teal-400 rounded-tr-md" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-teal-400 rounded-bl-md" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-teal-400 rounded-br-md" />
                      <div className="laser-line" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/80 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
                    Point at a Qure QR code
                  </div>
                </>
              )}
            </div>

            {/* ── action buttons ── */}
            <div className="flex gap-2 mb-4">
              {torchSupported && (
                <button
                  onClick={handleTorchToggle}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    torchOn
                      ? "bg-teal-50 border-teal-300 text-teal-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon d={ICONS.torch} size={14} />
                  {torchOn ? "Torch on" : "Torch"}
                </button>
              )}

              <button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                <Icon d={ICONS.refresh} size={14} />
                Retry
              </button>

              <button
                onClick={handleUploadClick}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                <Icon d={ICONS.upload} size={14} />
                Upload
              </button>
            </div>

            {/* ── info banner ── */}
            <div className="flex gap-2.5 bg-teal-50 border border-teal-100 rounded-xl p-3.5">
              <div className="text-teal-500 mt-0.5 shrink-0"><Icon d={ICONS.info} size={13} /></div>
              <p className="text-xs text-teal-700 leading-relaxed">
                Your role determines what you'll see. Verified doctors access full records — other patients see name, blood group and allergies only. Every scan is logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main QR Section ──────────────────────────────────────────────────────────
export default function QRSection() {
  const [showScanner, setShowScanner] = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);
  const [resolvedPatientId, setResolvedPatientId] = useState(null);
  const [profilePatient, setProfilePatient] = useState(null);
  const [accessSummary, setAccessSummary] = useState(null);
  const [recentAccess, setRecentAccess] = useState([]);
  const [accessLoading, setAccessLoading] = useState(true);
  const [doctorLicenseLoading, setDoctorLicenseLoading] = useState(false);
  const [doctorLicenseVerified, setDoctorLicenseVerified] = useState(false);

  const rawPatient = localStorage.getItem("patient");
  let parsedPatient = null;

  try {
    parsedPatient = rawPatient ? JSON.parse(rawPatient) : null;
  } catch {
    parsedPatient = null;
  }

  const patientData = parsedPatient?.data ?? parsedPatient ?? {};
  const userRole = String(patientData?.role || "").toLowerCase();
  const isDoctorRole = userRole === "doctor";

  useEffect(() => {
    let mounted = true;

    async function hydrateQrData() {
      setAccessLoading(true);

      try {
        const profileRes = await api.get("/auth/profile");
        const profilePatient = profileRes?.data?.patient || null;
        const profilePatientId = profilePatient?._id;

        if (mounted) {
          setProfilePatient(profilePatient);
        }

        if (mounted && profilePatientId) {
          setResolvedPatientId(profilePatientId);
        }
      } catch {
        if (mounted) setProfilePatient(null);
      }

      try {
        const accessRes = await api.get("/auth/qr-access-overview");

        if (!mounted) return;

        setAccessSummary(accessRes?.data?.summary || null);
        setRecentAccess(Array.isArray(accessRes?.data?.recentAccess) ? accessRes.data.recentAccess : []);
      } catch {
        if (!mounted) return;
        setAccessSummary(null);
        setRecentAccess([]);
      } finally {
        if (mounted) setAccessLoading(false);
      }
    }

    hydrateQrData();

    return () => {
      mounted = false;
    };
  }, [patientData?._id, patientData?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadDoctorLicenseStatus() {
      if (!isDoctorRole) {
        setDoctorLicenseLoading(false);
        setDoctorLicenseVerified(false);
        return;
      }

      setDoctorLicenseLoading(true);

      try {
        const res = await api.get("/auth/doctor/license-status");
        if (!mounted) return;
        setDoctorLicenseVerified(Boolean(res?.data?.isNmcVerified));
      } catch {
        if (!mounted) return;
        setDoctorLicenseVerified(false);
      } finally {
        if (mounted) setDoctorLicenseLoading(false);
      }
    }

    loadDoctorLicenseStatus();

    return () => {
      mounted = false;
    };
  }, [isDoctorRole]);

  const patientIdentifier =
    resolvedPatientId ||
    patientData._id ||
    patientData.id ||
    patientData.email ||
    patientData.phone ||
    patientData.fullName ||
    "unknown";

  const normalizedPatientId = String(patientIdentifier).trim();
  const encodedPatientId = encodeURIComponent(normalizedPatientId);
  const patientDisplayName = String(patientData?.fullName || "").trim() || "Patient";
  const qrTitle = `${patientDisplayName}'s QR`;

  const appOrigin = window.location.origin;
  const shareLink = `${appOrigin}/view-report/${encodedPatientId}`;
  const qrValue = shareLink;

  const bloodGroup = profilePatient?.bloodGroup || patientData?.bloodGroup || "N/A";
  const criticalAllergy = (() => {
    const allergies = Array.isArray(profilePatient?.allergies) ? profilePatient.allergies : [];
    if (!allergies.length) return "N/A";

    const severeAllergy = allergies.find(
      (item) => String(item?.severity || "").toLowerCase() === "severe"
    );

    return severeAllergy?.name || allergies[0]?.name || "N/A";
  })();

  const scansThisMonth = accessSummary?.scansThisMonth ?? 0;
  const totalScans = accessSummary?.totalScans ?? 0;
  const lastScannedAt = accessSummary?.lastScannedAt || null;
  const lastScannerName = accessSummary?.lastScannerName || "No scans yet";
  const scanLockedForDoctor = isDoctorRole && !doctorLicenseVerified;
  const scanButtonDisabled = doctorLicenseLoading || scanLockedForDoctor;
  const scanButtonLabel =
    doctorLicenseLoading && isDoctorRole
      ? "Checking..."
      : scanLockedForDoctor
      ? "NMC Verification Needed"
      : "Scan QR";

  function handleShare() {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleDownload() {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2200);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">QR Code & Sharing</h1>
        <p className="text-sm text-gray-400 mt-1">
          Show your QR to a doctor for instant, secure access to your medical records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ══ LEFT — QR card ══ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <p className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-7">
            <Icon d={ICONS.qr} size={13} /> Your patient QR
          </p>

          <div className="flex flex-col items-center">
            <div className="relative bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
              <span className="absolute -top-px -left-px   w-5 h-5 border-t-[3px] border-l-[3px] border-teal-400 rounded-tl-lg" />
              <span className="absolute -top-px -right-px  w-5 h-5 border-t-[3px] border-r-[3px] border-teal-400 rounded-tr-lg" />
              <span className="absolute -bottom-px -left-px  w-5 h-5 border-b-[3px] border-l-[3px] border-teal-400 rounded-bl-lg" />
              <span className="absolute -bottom-px -right-px w-5 h-5 border-b-[3px] border-r-[3px] border-teal-400 rounded-br-lg" />

              <QRCodeSVG
                value={qrValue}
                size={200}
                bgColor="#ffffff"
                fgColor="#1a2332"
                level="M"
              />
            </div>

            <p className="text-xl font-semibold text-gray-900 text-center wrap-break-word">{qrTitle}</p>
            <p className="text-xs text-gray-400 mt-1 mb-7">Scan to share health records securely</p>

            <div className="flex gap-3 w-full mb-7">
              <div className="flex-1 border border-gray-100 rounded-xl p-3.5 bg-gray-50">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Blood group</p>
                <p className="text-base font-semibold text-gray-900">{bloodGroup}</p>
              </div>
              <div className="flex-1 border border-red-100 rounded-xl p-3.5 bg-red-50">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Critical allergy</p>
                <p className="text-base font-semibold text-red-500">{criticalAllergy}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <button onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all">
                <Icon d={copied ? ICONS.check : ICONS.share} size={15} />
                {copied ? "Copied!" : "Share Link"}
              </button>
              <button onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all">
                <Icon d={downloaded ? ICONS.check : ICONS.download} size={15} />
                {downloaded ? "Saved!" : "Download"}
              </button>
              <button
                onClick={() => {
                  if (scanButtonDisabled) return;
                  setShowScanner(true);
                }}
                disabled={scanButtonDisabled}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  scanButtonDisabled
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-teal-500 text-white hover:bg-teal-600 active:scale-[0.98]"
                }`}
              >
                <Icon d={ICONS.scan} size={15} />
                {scanButtonLabel}
              </button>
            </div>

            {scanLockedForDoctor && (
              <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-xs text-amber-700 leading-relaxed">
                  QR scan is locked for your account. Complete doctor NMC verification from Home page to unlock scanning.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 my-8" />

          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4">Who can see what</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-teal-700">
                <Icon d={ICONS.shield} size={14} />
                <span className="text-sm font-medium">Verified doctor</span>
              </div>
              <p className="text-xs text-teal-600 leading-relaxed">Full medical history, reports, prescriptions & chronic conditions</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Icon d={ICONS.user} size={14} />
                <span className="text-sm font-medium">Another patient</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Name, blood group, known allergies & emergency contact only</p>
            </div>
          </div>

          <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <div className="text-blue-400 mt-0.5 shrink-0"><Icon d={ICONS.info} size={13} /></div>
            <p className="text-xs text-blue-600 leading-relaxed">
              Every scan is encrypted and logged with the scanner's identity, timestamp, and access level. Review all access in{" "}
              <span className="font-medium underline cursor-pointer">Access Logs</span>.
            </p>
          </div>
        </div>

        {/* ══ RIGHT column ══ */}
        <div className="flex flex-col gap-5">

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-5">
              <Icon d={ICONS.eye} size={13} /> Access overview
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5">
                <p className="text-xs text-gray-500 mb-1">Scans this month</p>
                <p className="text-2xl font-semibold text-teal-700">{accessLoading ? "..." : scansThisMonth}</p>
                <p className="text-[11px] text-teal-500 mt-0.5">Total scans: {accessLoading ? "..." : totalScans}</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5">
                <p className="text-xs text-gray-500 mb-1">Last scanned</p>
                <p className="text-sm font-semibold text-teal-700 mt-1">{accessLoading ? "Loading..." : formatTimeAgo(lastScannedAt)}</p>
                <p className="text-[11px] text-teal-500 mt-0.5 truncate">{accessLoading ? "Fetching scanner..." : lastScannerName}</p>
              </div>
            </div>

            <p className="text-xs font-medium text-gray-400 mb-3">Recent access</p>
            <div className="divide-y divide-gray-50">
              {!accessLoading && recentAccess.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-400">No one has scanned your QR yet.</div>
              )}

              {(accessLoading ? [] : recentAccess).map((scan) => {
                const initials = String(scan?.scannerName || "Unknown")
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isDoctor = String(scan?.scannerRole || "").toLowerCase() === "doctor";

                return (
                <div key={scan?.id || `${scan?.scannerName}-${scan?.scannedAt}`} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-xs font-semibold text-teal-700 shrink-0">
                    {initials || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{scan?.scannerName || "Unknown User"}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${isDoctor ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
                        {toRoleLabel(scan?.scannerRole)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {isDoctor ? (scan?.scannerSpecialization || "Doctor") : "Patient"} · {scan?.accessLevel === "full" ? "Full access" : "Limited access"}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-300 shrink-0">{formatTimeAgo(scan?.scannedAt)}</span>
                </div>
              )})}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="flex items-center gap-2 text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4">
              <Icon d={ICONS.refresh} size={13} /> QR management
            </p>

            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-4">
              <div className="text-amber-400 mt-0.5 shrink-0"><Icon d={ICONS.info} size={13} /></div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Regenerating your QR invalidates the old one. Any saved copies or shared links will stop working immediately.
              </p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all">
              <Icon d={ICONS.refresh} size={14} />
              Regenerate QR Code
            </button>
          </div>

        </div>
      </div>

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} />}

      {(copied || downloaded) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full z-50 shadow-xl">
          {copied ? "Share link copied to clipboard" : "QR code saved"}
        </div>
      )}
    </>
  );
}