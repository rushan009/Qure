import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Heart,
  MapPin,
  Phone,
  Pill,
  ShieldAlert,
  Stethoscope,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../service/api";

const SCAN_GRANT_KEY = "qure_view_report_scan_grant";
const SCAN_GRANT_MAX_AGE_MS = 60 * 60 * 1000;

function hasValidScanGrant(patientId) {
  const raw = sessionStorage.getItem(SCAN_GRANT_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    const grantedPatientId = String(parsed?.patientId || "").trim();
    const issuedAt = Number(parsed?.issuedAt || 0);
    const age = Date.now() - issuedAt;

    if (!grantedPatientId || grantedPatientId !== String(patientId || "").trim()) {
      return false;
    }

    if (!issuedAt || Number.isNaN(age) || age < 0 || age > SCAN_GRANT_MAX_AGE_MS) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toISOString().slice(0, 10);
}

function formatAge(dob) {
  if (!dob) return "N/A";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "N/A";

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 ? `${years} yrs` : "N/A";
}

function formatValue(value, fallback = "N/A") {
  const text = String(value || "").trim();
  return text || fallback;
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-2 text-[12px] sm:text-[13px] font-semibold transition-colors ${
        active
          ? "bg-[hsl(196,64%,50%)] border-[hsl(196,64%,50%)] text-white"
          : "bg-[hsl(184,46%,88%)] border-[hsl(120,12%,82%)] text-[hsl(200,15%,35%)] hover:bg-[hsl(184,48%,85%)]"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

export default function ViewReport() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("diseases");
  const [expandedDiseaseId, setExpandedDiseaseId] = useState(null);

  useEffect(() => {
    const clearScanGrantOnUnload = () => {
      sessionStorage.removeItem(SCAN_GRANT_KEY);
    };

    window.addEventListener("beforeunload", clearScanGrantOnUnload);
    window.addEventListener("pagehide", clearScanGrantOnUnload);

    return () => {
      window.removeEventListener("beforeunload", clearScanGrantOnUnload);
      window.removeEventListener("pagehide", clearScanGrantOnUnload);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      if (!patientId) {
        setError("Patient id is missing in this scan link.");
        setLoading(false);
        return;
      }

      if (!hasValidScanGrant(patientId)) {
        setError("Access denied. Please scan the QR again to view this report.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/auth/patients/${encodeURIComponent(patientId)}`);
        if (!mounted) return;

        setPatient(response?.data || null);
        setError("");
      } catch (err) {
        if (!mounted) return;
        const message = err?.response?.data?.message || err?.message || "Unable to load patient report.";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  const accessScope = String(patient?.accessScope || "limited").toLowerCase();
  const isFullAccess = accessScope === "full" || accessScope === "self";

  const user = patient?.user || {};
  const diseases = useMemo(
    () => (Array.isArray(patient?.diseases) ? patient.diseases : []),
    [patient?.diseases]
  );
  const medications = useMemo(
    () => (Array.isArray(patient?.generalMedications) ? patient.generalMedications : []),
    [patient?.generalMedications]
  );
  const reports = useMemo(
    () => (Array.isArray(patient?.reports) ? patient.reports : []),
    [patient?.reports]
  );
  const allergies = useMemo(
    () => (Array.isArray(patient?.allergies) ? patient.allergies : []),
    [patient?.allergies]
  );

  const emergencyPrimary = useMemo(() => {
    const contacts = Array.isArray(patient?.emergencyContacts) ? patient.emergencyContacts : [];
    return contacts.find((item) => item?.isPrimary) || contacts[0] || patient?.emergencyContact || null;
  }, [patient]);

  const emergencyContacts = useMemo(() => {
    const contacts = Array.isArray(patient?.emergencyContacts) ? patient.emergencyContacts : [];
    if (contacts.length) return contacts;

    const legacy = patient?.emergencyContact;
    if (legacy && (legacy?.name || legacy?.phone || legacy?.relation || legacy?.email)) {
      return [legacy];
    }

    return [];
  }, [patient]);

  const activeConditions = useMemo(
    () => diseases.filter((item) => String(item?.status || "").toLowerCase() !== "resolved"),
    [diseases]
  );

  const latestVitals = patient?.lastVitals || {};

  const patientName = formatValue(user?.fullName, "Unknown Patient");
  const ageText = formatAge(patient?.dob);
  const genderText = formatValue(patient?.gender);
  const bloodText = formatValue(patient?.bloodGroup);

  const allergyNames = allergies
    .map((item) => formatValue(item?.name, ""))
    .filter(Boolean)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(184,35%,95%)]">
        <div className="text-center text-[hsl(200,15%,45%)]">
          <Activity size={30} className="mx-auto mb-2 animate-pulse text-[hsl(196,64%,45%)]" />
          Loading patient report...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(184,35%,95%)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
          <AlertTriangle size={30} className="mx-auto mb-3 text-red-500" />
          <h2 className="mb-2 text-[16px] font-bold text-[hsl(200,15%,18%)]">Report Unavailable</h2>
          <p className="text-[13px] text-[hsl(200,15%,45%)]">{error}</p>
        </div>
      </div>
    );
  }

  const patientObjectId = String(patient?._id || patientId || "");

  const toggleDiseaseExpand = (id) => {
    setExpandedDiseaseId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[hsl(184,36%,93%)]">
      <header className="border-b border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full hover:bg-[hsl(184,42%,84%)] text-[hsl(200,15%,35%)] flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-8 h-8 rounded-full bg-[hsl(196,64%,82%)] flex items-center justify-center">
              <User size={14} className="text-[hsl(196,64%,36%)]" />
            </div>
            <p className="text-[22px] font-bold text-[hsl(200,20%,20%)] truncate">Patient Report</p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(120,12%,80%)] bg-[hsl(184,45%,86%)] px-3 py-1 text-[12px] font-semibold text-[hsl(200,15%,35%)]">
            {isFullAccess ? "Doctor Access" : "Limited Access"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <section className="rounded-2xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,86%)] p-5 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(196,64%,84%)] flex items-center justify-center shrink-0">
                <User size={26} className="text-[hsl(196,64%,36%)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[34px] font-extrabold text-[hsl(200,25%,15%)] leading-tight truncate">{patientName}</h1>
                <p className="text-[15px] text-[hsl(200,15%,40%)] mt-1">
                  {ageText} | {genderText} | DOB: {formatDate(patient?.dob)} | {bloodText}
                </p>
              </div>
            </div>

            <div className="text-[14px] text-[hsl(200,15%,38%)] space-y-1">
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>{formatValue(user?.phone)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={14} />
                <span>{formatValue(user?.email)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{formatValue(patient?.address)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[hsl(200,15%,38%)]">
            <span className="font-medium">Allergies:</span>
            {allergyNames.length ? (
              allergyNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-red-200 bg-red-100 px-2.5 py-0.5 text-[12px] font-semibold text-red-600"
                >
                  {name}
                </span>
              ))
            ) : (
              <span>N/A</span>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-red-500">
              <ShieldAlert size={15} />
              <h2 className="text-[18px] font-bold">Emergency Information</h2>
            </div>

            <p className="text-[13px] text-[hsl(200,15%,38%)] flex items-start gap-2 mb-2">
              <Phone size={13} className="mt-0.5 shrink-0" />
              <span>
                Emergency Contact: {formatValue(emergencyPrimary?.name)} ({formatValue(emergencyPrimary?.relation)}) - {formatValue(emergencyPrimary?.phone)}
              </span>
            </p>

            {isFullAccess ? (
              <div className="text-[13px] text-[hsl(200,15%,38%)] flex items-start gap-2">
                <Heart size={13} className="mt-0.5 shrink-0" />
                <div>
                  <p>Chronic Conditions</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {activeConditions.length ? (
                      activeConditions.slice(0, 5).map((condition) => (
                        <span
                          key={condition?._id || condition?.name}
                          className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600"
                        >
                          {formatValue(condition?.name)}
                        </span>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-[18px] font-bold text-[hsl(200,25%,15%)]">Latest Vitals</h2>
              <span className="text-[12px] text-[hsl(200,15%,40%)]">{formatDate(latestVitals?.recordedAt)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-[hsl(184,45%,92%)] border border-[hsl(120,12%,82%)] p-3 text-center">
                <p className="text-[11px] text-[hsl(200,15%,45%)]">BP</p>
                <p className="text-[21px] font-extrabold text-[hsl(200,25%,15%)] mt-1">{formatValue(latestVitals?.bp)}</p>
              </div>
              <div className="rounded-xl bg-[hsl(184,45%,92%)] border border-[hsl(120,12%,82%)] p-3 text-center">
                <p className="text-[11px] text-[hsl(200,15%,45%)]">Heart Rate</p>
                <p className="text-[21px] font-extrabold text-[hsl(200,25%,15%)] mt-1">{formatValue(latestVitals?.heartRate)}</p>
              </div>
              <div className="rounded-xl bg-[hsl(184,45%,92%)] border border-[hsl(120,12%,82%)] p-3 text-center">
                <p className="text-[11px] text-[hsl(200,15%,45%)]">Blood Sugar</p>
                <p className="text-[21px] font-extrabold text-[hsl(200,25%,15%)] mt-1">{formatValue(latestVitals?.bloodSugar)}</p>
              </div>
              <div className="rounded-xl bg-[hsl(184,45%,92%)] border border-[hsl(120,12%,82%)] p-3 text-center">
                <p className="text-[11px] text-[hsl(200,15%,45%)]">BMI</p>
                <p className="text-[21px] font-extrabold text-[hsl(200,25%,15%)] mt-1">
                  {patient?.height && patient?.weight
                    ? (Number(patient.weight) / (Number(patient.height) / 100) ** 2).toFixed(1)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {isFullAccess ? (
          <>
            <section className="mb-3 flex flex-wrap items-center gap-2">
              <TabButton active={activeTab === "diseases"} onClick={() => setActiveTab("diseases")} icon={Stethoscope} label="Diseases" />
              <TabButton active={activeTab === "medications"} onClick={() => setActiveTab("medications")} icon={Pill} label="General Medications" />
              <TabButton active={activeTab === "reports"} onClick={() => setActiveTab("reports")} icon={FileText} label="Reports" />
              <TabButton active={activeTab === "emergency-contacts"} onClick={() => setActiveTab("emergency-contacts")} icon={Phone} label="Emergency Contacts" />
            </section>

            {activeTab === "diseases" ? (
              <section>
                <p className="text-[13px] text-[hsl(200,15%,40%)] mb-2">{activeConditions.length} active conditions</p>

                {activeConditions.length ? (
                  <div className="space-y-3">
                    {activeConditions.map((condition) => {
                      const conditionId = String(condition?._id || condition?.name || "condition");
                      const isOpen = expandedDiseaseId === conditionId;
                      const meds = Array.isArray(condition?.prescribedMedications)
                        ? condition.prescribedMedications
                        : [];

                      return (
                        <div
                          key={conditionId}
                          className="rounded-2xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-4"
                        >
                          <button
                            type="button"
                            onClick={() => toggleDiseaseExpand(conditionId)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <h3 className="text-[23px] font-bold text-[hsl(200,25%,15%)]">{formatValue(condition?.name)}</h3>
                                <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">
                                  Diagnosed: {formatDate(condition?.diagnosisDate)} | Dr. {formatValue(condition?.doctorName)} | {meds.length} med{meds.length === 1 ? "" : "s"}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  {formatValue(condition?.severity)}
                                </span>
                                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  {formatValue(condition?.status)}
                                </span>
                                {isOpen ? (
                                  <ChevronUp size={16} className="text-[hsl(200,15%,40%)]" />
                                ) : (
                                  <ChevronDown size={16} className="text-[hsl(200,15%,40%)]" />
                                )}
                              </div>
                            </div>
                          </button>

                          {isOpen ? (
                            <div className="mt-3 border-t border-[hsl(120,12%,80%)] pt-3">
                              <p className="text-[12px] font-semibold text-[hsl(200,15%,40%)] mb-2">Prescribed Medications</p>
                              {meds.length ? (
                                <div className="space-y-2">
                                  {meds.map((med, index) => (
                                    <div
                                      key={`${med?.medication || "med"}-${index}`}
                                      className="rounded-xl border border-[hsl(120,12%,82%)] bg-[hsl(184,45%,92%)] p-3"
                                    >
                                      <p className="text-[14px] font-semibold text-[hsl(200,25%,15%)]">{formatValue(med?.medication)}</p>
                                      <p className="text-[12px] text-[hsl(200,15%,40%)] mt-0.5">
                                        {formatValue(med?.dosage)} | {formatValue(med?.frequency)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[13px] text-[hsl(200,15%,40%)]">No prescribed medications listed.</p>
                              )}

                              <div className="mt-3 rounded-xl border border-[hsl(120,12%,82%)] bg-[hsl(184,45%,92%)] p-3">
                                <p className="text-[12px] font-semibold text-[hsl(200,15%,40%)] mb-1">Notes</p>
                                <p className="text-[13px] text-[hsl(200,15%,40%)]">
                                  {formatValue(condition?.notes)}
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                    No active conditions found.
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === "medications" ? (
              <section>
                {medications.length ? (
                  <div className="space-y-3">
                    {medications.map((medication, index) => (
                      <div
                        key={medication?._id || `${medication?.name}-${index}`}
                        className="rounded-xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-4"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[15px] font-bold text-[hsl(200,25%,15%)]">{formatValue(medication?.name)}</h3>
                          <span className="rounded-full border border-[hsl(120,12%,80%)] bg-[hsl(184,45%,92%)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(200,15%,40%)]">
                            {formatValue(medication?.category)}
                          </span>
                        </div>
                        <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">
                          {formatValue(medication?.dose)} | {formatValue(medication?.frequency)} | {formatValue(medication?.purpose)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                    No general medications found.
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === "reports" ? (
              <section>
                {reports.length ? (
                  <div className="space-y-3">
                    {reports.map((report, index) => (
                      <div
                        key={report?._id || `${report?.title}-${index}`}
                        className="rounded-xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-4"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="text-[15px] font-bold text-[hsl(200,25%,15%)]">{formatValue(report?.title)}</h3>
                            <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">
                              {formatValue(report?.category)} | {formatDate(report?.reportDate)}
                            </p>
                            <p className="text-[12px] text-[hsl(200,15%,45%)] mt-0.5">
                              {formatValue(report?.doctorName)} | {formatValue(report?.hospitalName)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!report?._id) return;
                              const viewUrl = `/api/auth/patients/${encodeURIComponent(
                                patientObjectId
                              )}/reports/${encodeURIComponent(report._id)}/view`;
                              window.open(viewUrl, "_blank", "noopener,noreferrer");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[hsl(120,12%,80%)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[hsl(200,15%,35%)] hover:bg-[hsl(184,45%,92%)]"
                          >
                            <Eye size={13} />
                            View Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                    No reports found.
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === "emergency-contacts" ? (
              <section>
                {emergencyContacts.length ? (
                  <div className="space-y-3">
                    {emergencyContacts.map((contact, index) => (
                      <div
                        key={`${contact?._id || contact?.phone || "contact"}-${index}`}
                        className="rounded-xl border border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[15px] font-bold text-[hsl(200,25%,15%)]">
                            {formatValue(contact?.name)}
                          </h3>
                          {contact?.isPrimary ? (
                            <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                              Primary
                            </span>
                          ) : null}
                        </div>

                        <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">
                          Relation: {formatValue(contact?.relation)}
                        </p>
                        <p className="text-[13px] text-[hsl(200,15%,40%)] mt-0.5">
                          Phone: {formatValue(contact?.phone)}
                        </p>
                        <p className="text-[13px] text-[hsl(200,15%,40%)] mt-0.5">
                          Email: {formatValue(contact?.email)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                    No emergency contacts found.
                  </div>
                )}
              </section>
            ) : null}
          </>
        ) : (
          <section className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,40%,88%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
            Limited view for non-doctor scan: only basic patient card, emergency info, and latest vitals are shown.
          </section>
        )}
      </main>
    </div>
  );
}
