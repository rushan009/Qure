import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Link2,
  Plus,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Btn, LabelXS, PageHeader, Tag } from "../../components/patient/ui";
import { useDiseaseList } from "../../hooks/useDisease";

const EMPTY_FORM = {
  name: "",
  doctorName: "",
  diagnosisDate: "",
  severity: "Mild",
  status: "Active",
  code: "",
  notes: "",
};

const EMPTY_MED_ROWS = [{ id: 1, medication: "", dosage: "", frequency: "" }];

function formatDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toISOString().split("T")[0];
}

export default function DiseasesPage() {
  const { diseases, loading, error, fetchDiseases, createDisease, updateDisease, removeDisease } = useDiseaseList();

  const [openedDis, setOpenedDis] = useState(false);
  const [expandedDiseaseId, setExpandedDiseaseId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [medInputs, setMedInputs] = useState(EMPTY_MED_ROWS);

  const activeDiseases = useMemo(
    () => diseases.filter((disease) => disease.status !== "Resolved"),
    [diseases],
  );

  const pastDiseases = useMemo(
    () => diseases.filter((disease) => disease.status === "Resolved"),
    [diseases],
  );

  const openDiseaseModal = () => {
    setSubmitError("");
    setFormData(EMPTY_FORM);
    setMedInputs(EMPTY_MED_ROWS);
    setOpenedDis(true);
  };

  const closeDiseaseModal = () => {
    setOpenedDis(false);
    setSubmitError("");
  };

  const addMedicationRow = () => {
    setMedInputs((prev) => [
      ...prev,
      { id: prev.length + 1, medication: "", dosage: "", frequency: "" },
    ]);
  };

  const removeMedicationRow = (index) => {
    setMedInputs((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : EMPTY_MED_ROWS;
    });
  };

  const handleMedicationInputChange = (index, field, value) => {
    setMedInputs((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleExpand = (id) => {
    setExpandedDiseaseId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this disease?")) return;

    try {
      await removeDisease(id);
      await fetchDiseases();
      if (expandedDiseaseId === id) setExpandedDiseaseId(null);
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to delete disease");
    }
  };

  const handleMoveToPast = async (id) => {
    try {
      await updateDisease(id, { status: "Resolved" });
      await fetchDiseases();
      if (expandedDiseaseId === id) setExpandedDiseaseId(null);
    } catch (err) {
      alert(err?.message || "Failed to update disease status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.doctorName.trim()) {
      setSubmitError("Disease name and doctor name are required");
      return;
    }

    setSaving(true);
    setSubmitError("");

    try {
      const prescribedMedications = medInputs
        .map((row) => ({
          medication: row.medication.trim(),
          dosage: row.dosage.trim(),
          frequency: row.frequency.trim(),
        }))
        .filter((row) => row.medication || row.dosage || row.frequency);

      await createDisease({
        ...formData,
        name: formData.name.trim(),
        doctorName: formData.doctorName.trim(),
        code: formData.code.trim(),
        notes: formData.notes.trim(),
        diagnosisDate: formData.diagnosisDate || null,
        prescribedMedications,
      });

      await fetchDiseases();
      closeDiseaseModal();
    } catch (err) {
      setSubmitError(err?.response?.data?.error || err?.message || "Failed to add disease");
    } finally {
      setSaving(false);
    }
  };

  const renderDiseaseCard = (disease) => {
    const isOpen = expandedDiseaseId === disease._id;
    const meds = Array.isArray(disease.prescribedMedications)
      ? disease.prescribedMedications
      : [];

    return (
      <div
        key={disease._id}
        className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl overflow-hidden"
      >
        <button
          className="w-full text-left p-4 cursor-pointer hover:bg-[hsl(184,46%,93%)] transition-colors duration-150"
          onClick={() => toggleExpand(disease._id)}
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex gap-2.5 min-w-0">
              <Activity size={15} className="text-[hsl(196,64%,50%)] mt-0.5 shrink-0" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="font-bold text-[14px]">{disease.name}</span>
                  {disease.code && disease.code !== "N/A" ? (
                    <span className="text-[11px] text-[hsl(200,15%,40%)] bg-[hsl(184,52%,92%)] px-1.5 py-0.5 rounded-md">
                      {disease.code}
                    </span>
                  ) : null}
                  <Tag label={disease.severity || "Mild"} type={disease.severity || "mild"} />
                  <Tag label={disease.status || "Active"} type={disease.status || "active"} />
                </div>

                <div className="flex flex-wrap gap-3 text-[12px] text-[hsl(200,15%,40%)]">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(disease.diagnosisDate)}</span>
                  <span className="flex items-center gap-1"><Stethoscope size={11} /> {disease.doctorName}</span>
                  <span className="flex items-center gap-1"><Link2 size={11} /> {meds.length} active med{meds.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>

            {isOpen ? (
              <ChevronUp size={16} className="text-[hsl(200,15%,40%)] shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-[hsl(200,15%,40%)] shrink-0" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-[hsl(120,12%,83%)] p-4 bg-[hsl(184,46%,94%)]">
            {disease.notes ? (
              <p className="text-[13px] text-[hsl(200,15%,38%)] mb-3">{disease.notes}</p>
            ) : null}

            {meds.length > 0 ? (
              <>
                <LabelXS className="mb-2">Prescribed Medications</LabelXS>
                <div className="space-y-2.5">
                  {meds.map((med, index) => (
                    <div key={`${med.medication}-${index}`} className="bg-white prescribed-med-white border border-[hsl(120,12%,83%)] rounded-xl p-3">
                      <div className="font-semibold text-[14px] text-[hsl(200,25%,16%)]">
                        {med.medication || "Unnamed medication"}
                        {med.dosage ? <span className="text-[12px] text-[hsl(200,15%,42%)] ml-1.5">{med.dosage}</span> : null}
                      </div>
                      <div className="text-[12px] text-[hsl(200,15%,42%)] mt-0.5">
                        {med.frequency || "No frequency provided"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-[12px] text-[hsl(200,15%,45%)]">No prescribed medications for this disease.</div>
            )}

            <div className="mt-3 flex justify-end gap-4">
              {disease.status !== "Resolved" ? (
                <button
                  onClick={() => handleMoveToPast(disease._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(196,64%,72%)] bg-[hsl(184,52%,92%)] text-[12px] font-semibold text-[hsl(200,15%,35%)] hover:bg-[hsl(196,64%,88%)] hover:text-[hsl(200,25%,20%)] transition-all duration-150 active:scale-[0.98]"
                >
                  Move to Past
                </button>
              ) : null}
              <button
                onClick={() => handleDelete(disease._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-[12px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 active:scale-[0.98]"
              >
                <Trash2 size={13} /> Delete Disease
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Diseases & Diagnoses"
        subtitle={`${activeDiseases.length} active · ${pastDiseases.length} resolved`}
        action={<Btn icon={Plus} label="Add Disease" primary onClick={openDiseaseModal} />}
      />

      {loading ? <div className="text-sm text-[hsl(200,15%,45%)] mb-3">Loading diseases...</div> : null}
      {error ? <div className="text-sm text-red-600 mb-3">{error}</div> : null}

      {activeDiseases.length > 0 ? (
        <>
          <LabelXS>
            <Activity size={11} /> Active Conditions
          </LabelXS>
          <div className="space-y-2.5">{activeDiseases.map(renderDiseaseCard)}</div>
        </>
      ) : null}

      {pastDiseases.length > 0 ? (
        <>
          <LabelXS className="mt-6">Past Conditions</LabelXS>
          <div className="space-y-2.5">{pastDiseases.map(renderDiseaseCard)}</div>
        </>
      ) : null}

      {!loading && diseases.length === 0 ? (
        <div className="medical-white-card text-[13px] text-[hsl(200,15%,45%)] bg-white border border-[hsl(120,12%,83%)] rounded-xl p-4 mt-2">
          No diseases added yet.
        </div>
      ) : null}

      {openedDis && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Add New Disease / Diagnosis</h2>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={closeDiseaseModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Disease / Condition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="e.g. Type 2 Diabetes"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Doctor Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={handleInputChange("doctorName")}
                    placeholder="e.g. Dr Sahas Patel"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Date of Diagnosis</label>
                  <input
                    type="date"
                    value={formData.diagnosisDate}
                    onChange={handleInputChange("diagnosisDate")}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">ICD / Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={handleInputChange("code")}
                    placeholder="e.g. E11"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={handleInputChange("severity")}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  >
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={handleInputChange("status")}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Managed">Managed</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange("notes")}
                  placeholder="Additional notes"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                />
              </div>

              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                <label>Prescribed Medications</label>
                <button type="button" className="text-blue-600 hover:text-blue-700" onClick={addMedicationRow}>
                  + Add
                </button>
              </div>

              <div className="space-y-2.5 mb-4">
                {medInputs.map((row, index) => (
                  <div key={row.id} className="relative rounded-xl border border-gray-200 bg-slate-50 p-3.5">
                    {medInputs.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeMedicationRow(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                        aria-label="Remove medication"
                      >
                        <X size={15} />
                      </button>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Medication name"
                        value={row.medication}
                        onChange={(e) => handleMedicationInputChange(index, "medication", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={row.dosage}
                        onChange={(e) => handleMedicationInputChange(index, "dosage", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        value={row.frequency}
                        onChange={(e) => handleMedicationInputChange(index, "frequency", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {submitError ? (
                <div className="mb-3 text-sm text-red-600">{submitError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDiseaseModal}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Add Disease"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
