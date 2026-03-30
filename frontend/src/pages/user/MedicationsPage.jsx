import { AlertTriangle, Plus } from "lucide-react";
import { Btn, PageHeader, LabelXS } from "../../components/patient/ui";
import { MedicationCard } from "../../components/patient/MedicalCards";
import { useState } from "react";
import { useMedicine, useMedicineList } from "../../hooks/useMedicine";


export default function MedicationsPage() {
  const [openedMed, setOpenedMed] = useState(false);
  const {medications, loading, fetchMedications} = useMedicineList();
  const {formData, handleChange, handleSubmit} = useMedicine(() => setOpenedMed(false), fetchMedications);

  const handleDelete = async (medId) => {
  await fetch(`/api/auth/medication/${medId}`, {
    method: "DELETE",
    credentials: "include",
  });
  fetchMedications(); // ← refetch after delete
};

// on card


  return (
    <>
      <div>
        <PageHeader
          title="General Medications"
          subtitle="Medications, supplements & OTC drugs not tied to a specific disease"
          action={
            <Btn
              icon={Plus}
              label="Add Medication"
              primary
              onClick={() => {
                setOpenedMed(true);
              }}
            />
          }
        />

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 px-4 text-[13px] text-amber-800 flex gap-2 items-start mb-5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Disease-specific medications are managed under each disease in the{" "}
            <strong>Diseases</strong> section. This section is for general
            medications, supplements, and OTC drugs.
          </span>
        </div>


        <LabelXS>Prescriptions</LabelXS>
        <div className="flex flex-col gap-3 mt-2 mb-5">
          {medications.filter(med => med.category === "Prescription (Rx)").map((med, idx) => (
            <MedicationCard key={med._id} medication={med} onDelete={handleDelete} />
          ))}
        </div>

       
        <LabelXS className="mt-5">OTC & Supplements</LabelXS>
        <div className="flex flex-col gap-3 mt-2 mb-5">
          {medications.filter(med => med.category !== "Prescription (Rx)").map((med, idx) => (
            <MedicationCard key={med._id} medication={med} onDelete={handleDelete} />
          ))}
        </div>
        
      </div>
      {openedMed && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-[480px] p-8 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Add General Medication
              </h2>
              <button className="text-gray-400 hover:text-gray-600 text-xl leading-none bg-none border-none cursor-pointer" onClick={() => setOpenedMed(false)}>
                ✕
              </button>
            </div>

            {/* Medication Name */}
            <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Medication Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Vitamin D3"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Dosage + Frequency */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Dosage
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  name="dose"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  value={formData.dose}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Frequency
                </label>
                <input
                  type="text"
                  placeholder="e.g. Once daily"
                  name="frequency"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  value={formData.frequency}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Purpose
              </label>
              <input
                type="text"
                  name="purpose"
                placeholder="e.g. Vitamin deficiency prevention"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                value={formData.purpose}
                onChange={handleChange}
              />
            </div>

            {/* Prescribed By + Category */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Prescribed / Recommended By
                </label>
                <input
                  type="text"
                  name="prescribedBy"
                  placeholder="e.g. Dr. Patel or Self"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                  value={formData.prescribedBy}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select name="category" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none cursor-pointer appearance-none" value={formData.category} onChange={handleChange}>
                  <option value="Prescription (Rx)">Prescription (Rx)</option>
                  <option value="OTC">OTC</option>
                  <option value="Supplement">Supplement</option>
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            {/* Instructions */}
            <div className="mb-7">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Instructions (optional)
              </label>
              <textarea
                name="instructions"
                placeholder="e.g. Take with meals"
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-slate-50 outline-none resize-y"
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>


            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenedMed(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 bg-white cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-300 cursor-pointer hover:bg-blue-400">
                Add Medication
              </button>
            </div>
          </form>
          </div>
        </div>
      )}
    </>
  );
}
