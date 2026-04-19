import { Clock3, Search, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";

const SCAN_GRANT_KEY = "qure_view_report_scan_grant";

function grantScan(patientId) {
  sessionStorage.setItem(
    SCAN_GRANT_KEY,
    JSON.stringify({
      patientId: String(patientId || "").trim(),
      issuedAt: Date.now(),
    })
  );
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const dateText = date.toISOString().slice(0, 10);
  const timeText = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${dateText} ${timeText}`;
}

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getDoctorDisplayName(fullName) {
  const name = String(fullName || "Doctor").trim();
  if (!name) return "Doctor";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "Doctor";
  return parts[parts.length - 1];
}

function getVerificationTone(verificationStatus, isNmcVerified) {
  if (isNmcVerified || verificationStatus === "verified") {
    return {
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      card: "border border-emerald-200 bg-emerald-50",
      title: "text-emerald-800",
    };
  }

  if (verificationStatus === "failed") {
    return {
      badge: "bg-red-100 text-red-700 border border-red-200",
      card: "border border-red-200 bg-red-50",
      title: "text-red-800",
    };
  }

  return {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    card: "border border-amber-200 bg-amber-50",
    title: "text-amber-800",
  };
}

export default function DoctorHomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState({
    patientsAttendedTillDate: 0,
    totalChecks: 0,
    checksThisMonth: 0,
  });
  const [doctorProfile, setDoctorProfile] = useState({
    fullName: "",
    specialization: "",
    hasLicenseSubmitted: false,
    isNmcVerified: false,
    verificationStatus: "not_submitted",
    verificationLabel: "Unverified Doctor",
    extractedNmcNumber: "",
    verificationSource: "none",
    verificationConfidence: 0,
    verificationFailureReason: "",
    verificationLastCheckedAt: null,
  });
  const [patientPreview, setPatientPreview] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [licenseFile, setLicenseFile] = useState(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState(false);
  const [manualNmcNumber, setManualNmcNumber] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [licenseMessage, setLicenseMessage] = useState("");
  const licenseInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadDoctorHome() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/auth/doctor/dashboard-summary");
        if (!mounted) return;

        const profile = res?.data?.doctorProfile || {};

        setDoctorProfile((prev) => ({
          ...prev,
          ...profile,
          hasLicenseSubmitted: Boolean(profile?.hasLicenseSubmitted),
          isNmcVerified: Boolean(profile?.isNmcVerified),
          verificationStatus: profile?.verificationStatus || "not_submitted",
          verificationLabel: profile?.verificationLabel || "Unverified Doctor",
          extractedNmcNumber: profile?.extractedNmcNumber || "",
          verificationSource: profile?.verificationSource || "none",
          verificationConfidence: Number(profile?.verificationConfidence || 0),
          verificationFailureReason: profile?.verificationFailureReason || "",
          verificationLastCheckedAt: profile?.verificationLastCheckedAt || null,
        }));

        setManualNmcNumber(String(profile?.extractedNmcNumber || ""));
        setSummary(res?.data?.summary || {});
        setPatientPreview(Array.isArray(res?.data?.patientPreview) ? res.data.patientPreview : []);
        setRecentLogs(Array.isArray(res?.data?.recentLogs) ? res.data.recentLogs : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load doctor home");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDoctorHome();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return patientPreview;

    return patientPreview.filter((item) => {
      const fields = [
        item?.patientId,
        item?.patientName,
        item?.patientEmail,
        item?.patientPhone,
        item?.bloodGroup,
      ];

      return fields.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [query, patientPreview]);

  const openPatient = (patientId) => {
    const id = String(patientId || "").trim();
    if (!id) return;

    grantScan(id);
    navigate(`/view-report/${encodeURIComponent(id)}`);
  };

  const greeting = getGreetingByTime();
  const doctorName = getDoctorDisplayName(doctorProfile?.fullName);
  const hasLicenseSubmitted = Boolean(doctorProfile?.hasLicenseSubmitted);
  const isNmcVerified = Boolean(doctorProfile?.isNmcVerified);
  const verificationStatus = String(
    doctorProfile?.verificationStatus || (hasLicenseSubmitted ? "pending" : "not_submitted")
  );
  const verificationTone = getVerificationTone(verificationStatus, isNmcVerified);

  function applyLicenseResponse(data) {
    setDoctorProfile((prev) => ({
      ...prev,
      hasLicenseSubmitted: Boolean(data?.hasLicenseSubmitted),
      isNmcVerified: Boolean(data?.isNmcVerified),
      verificationStatus: data?.verificationStatus || "not_submitted",
      verificationLabel: data?.verificationLabel || "Unverified Doctor",
      extractedNmcNumber: data?.extractedNmcNumber || "",
      verificationSource: data?.verificationSource || "none",
      verificationConfidence: Number(data?.verificationConfidence || 0),
      verificationFailureReason: data?.verificationFailureReason || "",
      verificationLastCheckedAt: data?.verificationLastCheckedAt || null,
    }));

    setManualNmcNumber(String(data?.extractedNmcNumber || ""));
  }

  async function handleLicenseUpload() {
    if (!licenseFile) {
      setLicenseError("Please select your license photo first.");
      setLicenseMessage("");
      return;
    }

    setUploadingLicense(true);
    setLicenseError("");
    setLicenseMessage("");

    try {
      const payload = new FormData();
      payload.append("licenseImage", licenseFile);

      const res = await api.post("/auth/doctor/license", payload);
      applyLicenseResponse(res?.data || {});

      setLicenseMessage(
        res?.data?.message || "License uploaded successfully."
      );
      setLicenseFile(null);
      if (licenseInputRef.current) {
        licenseInputRef.current.value = "";
      }
    } catch (err) {
      setLicenseError(err?.response?.data?.error || err?.message || "Failed to upload license photo");
    } finally {
      setUploadingLicense(false);
    }
  }

  async function handleLicenseDelete() {
    setDeletingLicense(true);
    setLicenseError("");
    setLicenseMessage("");

    try {
      const res = await api.delete("/auth/doctor/license");
      applyLicenseResponse(res?.data || {});

      setLicenseMessage(
        res?.data?.message ||
          "License removed successfully. Upload a new one to verify again."
      );

      setManualNmcNumber("");

      setLicenseFile(null);
      if (licenseInputRef.current) {
        licenseInputRef.current.value = "";
      }
    } catch (err) {
      setLicenseError(err?.response?.data?.error || err?.message || "Failed to delete license photo");
    } finally {
      setDeletingLicense(false);
    }
  }

  async function handleLicenseVerify() {
    if (!hasLicenseSubmitted) {
      setLicenseError("Upload license photo before verification.");
      setLicenseMessage("");
      return;
    }

    setVerifyingLicense(true);
    setLicenseError("");
    setLicenseMessage("");

    try {
      const payload = {};
      const cleanedManual = String(manualNmcNumber || "").trim();
      if (cleanedManual) {
        payload.manualNmcNumber = cleanedManual;
      }

      const res = await api.post("/auth/doctor/license/verify", payload);
      applyLicenseResponse(res?.data || {});

      setLicenseMessage(res?.data?.message || "Verification completed.");
    } catch (err) {
      setLicenseError(err?.response?.data?.error || err?.message || "Failed to verify license");
    } finally {
      setVerifyingLicense(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[42px] leading-none font-extrabold text-[hsl(200,25%,15%)]">
            {greeting}, Dr. {doctorName}
          </h1>
          <p className="text-[16px] text-[hsl(200,15%,40%)] mt-2">
            You have {Number(summary?.patientsAttendedTillDate || 0)} patients with active records.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${verificationTone.badge}`}
        >
          {doctorProfile?.verificationLabel || "Unverified Doctor"}
        </span>
      </div>

      {!hasLicenseSubmitted && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-[22px] leading-none font-bold text-[hsl(200,25%,15%)]">License Verification Required</h2>
          <p className="text-[13px] text-[hsl(200,15%,40%)] mt-2">
            Upload your doctor license photo first. After upload, run NMC verification to unlock the QR scan feature.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              ref={licenseInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setLicenseFile(selected);
                setLicenseError("");
                setLicenseMessage("");
              }}
              className="w-full sm:w-auto text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-[hsl(196,64%,50%)] file:px-3 file:py-2 file:text-white file:font-medium file:cursor-pointer"
            />
            <button
              type="button"
              onClick={handleLicenseUpload}
              disabled={uploadingLicense || deletingLicense || verifyingLicense}
              className={`px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap ${
                uploadingLicense || deletingLicense || verifyingLicense
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[hsl(196,64%,50%)] text-white hover:bg-[hsl(196,64%,45%)]"
              }`}
            >
              {uploadingLicense ? "Submitting..." : "Submit License Photo"}
            </button>
          </div>

          {licenseError && <p className="text-[12px] text-red-600 mt-3">{licenseError}</p>}
          {licenseMessage && <p className="text-[12px] text-emerald-700 mt-3">{licenseMessage}</p>}
        </div>
      )}

      {hasLicenseSubmitted && (
        <div className={`mb-5 rounded-2xl p-5 ${verificationTone.card}`}>
          <h2 className={`text-[22px] leading-none font-bold ${verificationTone.title}`}>
            {isNmcVerified ? "NMC Verified Doctor" : "License Submitted"}
          </h2>
          <p className="text-[13px] text-[hsl(200,15%,40%)] mt-2">
            {isNmcVerified
              ? "Verification complete. You can re-upload and re-verify if your license details change."
              : "Use Verify NMC now to check your registration and unlock QR scanning."}
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-[hsl(200,15%,35%)]">
            <p>
              Extracted NMC: <span className="font-semibold">{doctorProfile?.extractedNmcNumber || "Not detected"}</span>
            </p>
            <p>
              Confidence: <span className="font-semibold">{Math.round(Number(doctorProfile?.verificationConfidence || 0) * 100)}%</span>
            </p>
            <p>
              Source: <span className="font-semibold">{doctorProfile?.verificationSource || "none"}</span>
            </p>
            <p>
              Last checked: <span className="font-semibold">{formatDateTime(doctorProfile?.verificationLastCheckedAt)}</span>
            </p>
          </div>

          {doctorProfile?.verificationFailureReason && (
            <p className="text-[12px] text-red-700 mt-3">{doctorProfile.verificationFailureReason}</p>
          )}

          <div className="mt-4">
            <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1.5">
              Manual NMC Number (optional)
            </label>
            <input
              type="text"
              value={manualNmcNumber}
              onChange={(e) => setManualNmcNumber(e.target.value)}
              placeholder="Enter NMC number if OCR is incorrect"
              className="w-full sm:max-w-sm rounded-lg border border-[hsl(120,12%,80%)] px-3 py-2 text-[13px] text-[hsl(200,25%,15%)] outline-none focus:ring-2 focus:ring-[hsl(196,64%,78%)]"
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              ref={licenseInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setLicenseFile(selected);
                setLicenseError("");
                setLicenseMessage("");
              }}
              className="w-full sm:w-auto text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-[hsl(196,64%,50%)] file:px-3 file:py-2 file:text-white file:font-medium file:cursor-pointer"
            />
            <button
              type="button"
              onClick={handleLicenseUpload}
              disabled={uploadingLicense || deletingLicense || verifyingLicense}
              className={`px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap ${
                uploadingLicense || deletingLicense || verifyingLicense
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[hsl(196,64%,50%)] text-white hover:bg-[hsl(196,64%,45%)]"
              }`}
            >
              {uploadingLicense ? "Uploading..." : "Re-upload License Photo"}
            </button>
            <button
              type="button"
              onClick={handleLicenseVerify}
              disabled={uploadingLicense || deletingLicense || verifyingLicense}
              className={`px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap ${
                uploadingLicense || deletingLicense || verifyingLicense
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[hsl(170,70%,40%)] text-white hover:bg-[hsl(170,70%,35%)]"
              }`}
            >
              {verifyingLicense ? "Verifying..." : isNmcVerified ? "Re-verify NMC" : "Verify NMC Now"}
            </button>
            <button
              type="button"
              onClick={handleLicenseDelete}
              disabled={uploadingLicense || deletingLicense || verifyingLicense}
              className={`px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold transition-colors whitespace-nowrap ${
                uploadingLicense || deletingLicense || verifyingLicense
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-white text-red-600 border border-red-300 hover:bg-red-50"
              }`}
            >
              {deletingLicense ? "Deleting..." : "Delete License"}
            </button>
          </div>

          {licenseError && <p className="text-[12px] text-red-600 mt-3">{licenseError}</p>}
          {licenseMessage && <p className="text-[12px] text-emerald-700 mt-3">{licenseMessage}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
            <Users size={14} className="text-[hsl(196,64%,45%)]" />
          </div>
          <div>
            <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">
              {Number(summary?.patientsAttendedTillDate || 0)}
            </div>
            <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Patients Attended</div>
          </div>
        </div>

        <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
            <Clock3 size={14} className="text-[hsl(196,64%,45%)]" />
          </div>
          <div>
            <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">
              {Number(summary?.totalChecks || 0)}
            </div>
            <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Total Checks</div>
          </div>
        </div>

        <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
            <Clock3 size={14} className="text-[hsl(196,64%,45%)]" />
          </div>
          <div>
            <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">
              {Number(summary?.checksThisMonth || 0)}
            </div>
            <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Checks This Month</div>
          </div>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(200,15%,45%)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name or QR ID..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] text-[14px] text-[hsl(200,25%,15%)] placeholder:text-[hsl(200,15%,45%)] outline-none focus:ring-2 focus:ring-[hsl(196,64%,78%)]"
        />
      </div>

      {loading ? (
        <div className="text-[13px] text-[hsl(200,15%,40%)] mb-5">Loading doctor history...</div>
      ) : error ? (
        <div className="text-[13px] text-red-600 mb-5">{error}</div>
      ) : (
        <>
          {filteredPatients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,46%,90%)] p-6 text-center text-[13px] text-[hsl(200,15%,40%)] mb-5">
              No patient history found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
              {filteredPatients.map((item) => (
                <button
                  key={item.patientId}
                  type="button"
                  onClick={() => openPatient(item?.patientId)}
                  className="text-left rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-4 hover:bg-[hsl(184,48%,84%)] transition-colors"
                >
                  <p className="text-[11px] tracking-wide text-[hsl(200,15%,45%)]">
                    QR-{String(item?.patientId || "").slice(-4).toUpperCase()}
                  </p>
                  <p className="text-[22px] leading-none font-bold text-[hsl(200,25%,15%)] mt-3">
                    {item?.patientName || "Unknown"}
                  </p>
                  <p className="text-[14px] text-[hsl(200,15%,40%)] mt-2">Blood Group: {item?.bloodGroup || "N/A"}</p>
                  <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">Last: {formatDateTime(item?.lastCheckedAt)}</p>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-5 overflow-auto">
            <h2 className="text-[31px] leading-none font-bold text-[hsl(200,25%,15%)] mb-4">Access Logs</h2>

            {recentLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,46%,90%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                No access history yet.
              </div>
            ) : (
              <table className="min-w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[hsl(200,15%,40%)] border-b border-[hsl(120,12%,83%)]">
                    <th className="py-2.5 pr-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 pr-3 font-semibold">Patient</th>
                    <th className="py-2.5 pr-3 font-semibold">Action</th>
                    <th className="py-2.5 font-semibold">Patient ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log) => (
                    <tr key={log.id || `${log.patientId}-${log.scannedAt}`} className="border-b border-[hsl(120,12%,83%)]/60">
                      <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{formatDateTime(log?.scannedAt)}</td>
                      <td className="py-2.5 pr-3 text-[hsl(200,25%,15%)] font-medium">{log?.patientName || "Unknown"}</td>
                      <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{log?.action || "Checked patient"}</td>
                      <td className="py-2.5 text-[hsl(200,15%,40%)]">{log?.patientId || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
