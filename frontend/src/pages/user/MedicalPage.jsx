import {
  AlertTriangle,
  Stethoscope,
  Pill,
  Droplets,
  Activity,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Tag, SectionHdr, StatCard, Card, PageHeader } from "../../components/patient/ui";
import api from "../../service/api";

function valueOrDash(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

export default function MedicalPage({ onViewAllConditions = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [patient, setPatient] = useState(null);
  const [diseases, setDiseases] = useState([]);
  const [medications, setMedications] = useState([]);

  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allergyName, setAllergyName] = useState("");
  const [allergySeverity, setAllergySeverity] = useState("Mild");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, diseaseRes, medicationRes] = await Promise.all([
        api.get("/auth/profile"),
        api.get("/auth/disease"),
        api.get("/auth/medication"),
      ]);

      setPatient(profileRes?.data?.patient || null);
      setDiseases(Array.isArray(diseaseRes?.data?.diseases) ? diseaseRes.data.diseases : []);
      setMedications(Array.isArray(medicationRes?.data?.medications) ? medicationRes.data.medications : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load medical summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allergies = Array.isArray(patient?.allergies) ? patient.allergies : [];

  const activeConditions = useMemo(
    () => diseases.filter((disease) => disease.status !== "Resolved"),
    [diseases],
  );

  const bmi = useMemo(() => {
    const height = Number(patient?.height);
    const weight = Number(patient?.weight);
    if (!height || !weight) return "-";
    return (weight / (height / 100) ** 2).toFixed(1);
  }, [patient?.height, patient?.weight]);

  const addAllergy = async (e) => {
    e.preventDefault();
    if (!allergyName.trim()) return;

    setSaving(true);
    try {
      await api.post("/auth/allergy", {
        name: allergyName.trim(),
        severity: allergySeverity,
      });

      setAllergyName("");
      setAllergySeverity("Mild");
      setShowAllergyModal(false);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to add allergy");
    } finally {
      setSaving(false);
    }
  };

  const deleteAllergy = async (allergyId) => {
    try {
      await api.delete(`/auth/allergy/${allergyId}`);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to delete allergy");
    }
  };

  if (loading) return <div className="text-sm text-[hsl(200,15%,40%)]">Loading medical summary...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div>
      <PageHeader title="Medical Summary" subtitle="Overview of your health profile at a glance" />

      <Card className="mb-4 border-red-200">
        <SectionHdr
          icon={AlertTriangle}
          action={
            <button
              onClick={() => setShowAllergyModal(true)}
              className="inline-flex items-center gap-1 text-[12px] text-[hsl(196,64%,50%)] font-semibold hover:underline"
            >
              <Plus size={12} /> Add
            </button>
          }
        >
          Critical Allergies
        </SectionHdr>

        {allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {allergies.map((a) => {
              const tone = (a?.severity || "Mild").toLowerCase();
              return (
                <div
                  key={a._id}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-[13px] border ${
                    tone === "severe"
                      ? "bg-red-50 border-red-200"
                      : tone === "moderate"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  {a.name}
                  <Tag label={a.severity || "Mild"} type={a.severity || "mild"} />
                  <button
                    onClick={() => deleteAllergy(a._id)}
                    className="text-[hsl(200,15%,45%)] hover:text-red-500"
                    aria-label="Delete allergy"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[13px] text-[hsl(200,15%,40%)]">No allergies added yet.</div>
        )}
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-4">
        <StatCard
          icon={Stethoscope}
          value={String(activeConditions.length)}
          label="Active Diseases"
          ibg="hsl(196,64%,88%)"
          iclr="hsl(196,64%,32%)"
        />
        <StatCard
          icon={Pill}
          value={String(medications.length)}
          label="Active Medications"
          ibg="hsl(47,100%,88%)"
          iclr="hsl(40,80%,34%)"
        />
        <StatCard
          icon={Droplets}
          value={valueOrDash(patient?.bloodGroup)}
          label="Blood Group"
          ibg="hsl(0,100%,94%)"
          iclr="hsl(0,80%,50%)"
        />
        <StatCard
          icon={Activity}
          value={bmi}
          label="BMI"
          ibg="hsl(68,56%,88%)"
          iclr="hsl(68,56%,30%)"
        />
      </div>

      <Card>
        <SectionHdr
          icon={Activity}
          action={
            <button
              onClick={onViewAllConditions}
              className="text-[12px] text-[hsl(196,64%,50%)] font-semibold cursor-pointer hover:underline"
            >
              View All →
            </button>
          }
        >
          Active Conditions
        </SectionHdr>

        {activeConditions.length > 0 ? (
          activeConditions.map((c, i) => (
            <div
              key={c._id}
              className={`medical-white-card rounded-xl px-3.5 py-3 flex items-center justify-between ${i > 0 ? "mt-2.5" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <Activity size={13} className="text-[hsl(196,64%,50%)]" />
                <span className="font-semibold text-[14px]">{c.name}</span>
                <Tag label={c.status || "Active"} type={c.status || "active"} />
              </div>
              <span className="text-[12px] text-[hsl(200,15%,40%)]">
                {(c.prescribedMedications?.length || 0)} meds
              </span>
            </div>
          ))
        ) : (
          <div className="text-[13px] text-[hsl(200,15%,40%)]">No active conditions found.</div>
        )}
      </Card>

      {showAllergyModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-semibold">Add Allergy</h3>
              <button onClick={() => setShowAllergyModal(false)} className="text-gray-500">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={addAllergy}>
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1">Allergy Name</label>
                <input
                  type="text"
                  value={allergyName}
                  onChange={(e) => setAllergyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                  placeholder="e.g. Penicillin"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium mb-1">Severity</label>
                <select
                  value={allergySeverity}
                  onChange={(e) => setAllergySeverity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-slate-50"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllergyModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-70"
                >
                  {saving ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
