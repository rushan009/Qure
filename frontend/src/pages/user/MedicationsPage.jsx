import { AlertTriangle, Plus } from "lucide-react";
import { Btn, PageHeader, LabelXS } from "../../components/patient/ui";
import { MedicationCard } from "../../components/patient/MedicalCards";

const RX_MEDS = [
  {
    name: "Aspirin", dose: "81mg", type: "Rx",
    purpose: "Cardiovascular protection",
    schedule: "Once daily", by: "Dr. Kim",
    since: "2023-06-15", refill: "2026-04-15",
    note: "Take with food",
  },
];

const OTC_MEDS = [
  {
    name: "Vitamin D3", dose: "2000 IU", type: "Supplement",
    purpose: "Vitamin D deficiency prevention",
    schedule: "Once daily", by: "Self / Dr. Patel",
    since: "2024-01-10",
    note: "Take with a fatty meal for better absorption",
  },
  {
    name: "Omega-3 Fish Oil", dose: "1000mg", type: "Supplement",
    purpose: "Cardiovascular health support",
    schedule: "Once daily", by: "Self",
    since: "2024-03-01",
  },
  {
    name: "Ibuprofen", dose: "200mg", type: "OTC",
    purpose: "Pain relief",
    schedule: "As needed", by: "OTC",
    since: "2025-01-01",
    note: "May cause stomach upset",
    noteColor: "text-red-500",
  },
];

export default function MedicationsPage() {
  return (
    <div>
      <PageHeader
        title="General Medications"
        subtitle="Medications, supplements & OTC drugs not tied to a specific disease"
        action={<Btn icon={Plus} label="Add Medication" primary />}
      />

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 px-4 text-[13px] text-amber-800 flex gap-2 items-start mb-5">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>
          Disease-specific medications are managed under each disease in the{" "}
          <strong>Diseases</strong> section. This section is for general medications,
          supplements, and OTC drugs.
        </span>
      </div>

      <LabelXS>Prescriptions</LabelXS>
      {RX_MEDS.map((m) => (
        <MedicationCard key={m.name} {...m} />
      ))}

      <LabelXS className="mt-5">OTC & Supplements</LabelXS>
      {OTC_MEDS.map((m) => (
        <MedicationCard key={m.name} {...m} />
      ))}
    </div>
  );
}
