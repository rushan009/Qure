import { Activity, Calendar, ChevronDown, Plus } from "lucide-react";
import { Tag, Btn, PageHeader, LabelXS } from "../../components/patient/ui";
import { DiseaseRow } from "../../components/patient/MedicalCards";

const ACTIVE = [
  { name: "Type 2 Diabetes Mellitus",   code: "E11",   severity: "Moderate", status: "Managed",  date: "2021-03-15", doctor: "Dr. Patel", meds: "2 active meds" },
  { name: "Essential Hypertension",      code: "I10",   severity: "Mild",     status: "Active",   date: "2022-08-20", doctor: "Dr. Kim",   meds: "1 active med" },
  { name: "Seasonal Allergic Rhinitis",  code: "J30.2", severity: "Mild",     status: "Managed",  date: "2019-05-10", doctor: "Dr. Singh", meds: "1 active med" },
];

export default function DiseasesPage() {
  return (
    <div>
      <PageHeader
        title="Diseases & Diagnoses"
        subtitle="3 active · 1 resolved"
        action={<Btn icon={Plus} label="Add Disease" primary />}
      />

      <LabelXS>
        <Activity size={11} /> Active Conditions
      </LabelXS>

      {ACTIVE.map((d) => (
        <DiseaseRow key={d.name} {...d} />
      ))}

      <LabelXS className="mt-6">Past Conditions</LabelXS>

      {/* Resolved entry */}
      <div className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 mb-2.5">
        <div className="flex justify-between items-start">
          <div className="flex gap-2.5">
            <Activity size={15} className="text-[hsl(196,64%,50%)] mt-0.5 shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="font-bold text-[14px]">Acute Bronchitis</span>
                <Tag label="Moderate" type="moderate" />
                <Tag label="Resolved" type="resolved" />
              </div>
              <div className="flex flex-wrap gap-3 text-[12px] text-[hsl(200,15%,40%)]">
                <span className="flex items-center gap-1"><Calendar size={11} /> 2025-12-05</span>
                <span>by Dr. Kim</span>
              </div>
            </div>
          </div>
          <ChevronDown size={15} className="text-[hsl(200,15%,40%)]" />
        </div>
      </div>
    </div>
  );
}
