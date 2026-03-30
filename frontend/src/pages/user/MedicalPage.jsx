import { AlertTriangle, Stethoscope, Pill, Droplets, Activity, HeartPulse } from "lucide-react";
import { Tag, SectionHdr, StatCard, VitalCard, Card, PageHeader } from "../../components/patient/ui";

const ALLERGIES = [
  { n: "Penicillin", t: "severe" },
  { n: "Peanuts",    t: "severe" },
  { n: "Latex",      t: "mild"   },
];

const CONDITIONS = [
  { name: "Type 2 Diabetes Mellitus",   status: "managed", meds: "2 meds" },
  { name: "Essential Hypertension",      status: "active",  meds: "1 med"  },
  { name: "Seasonal Allergic Rhinitis",  status: "managed", meds: "1 med"  },
];

export default function MedicalPage() {
  return (
    <div>
      <PageHeader title="Medical Summary" subtitle="Overview of your health profile at a glance" />

      {/* Allergies */}
      <Card className="mb-4 border-red-200">
        <SectionHdr icon={AlertTriangle}>Critical Allergies</SectionHdr>
        <div className="flex flex-wrap gap-2.5">
          {ALLERGIES.map(({ n, t }) => (
            <div
              key={n}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold text-[13px] border ${
                t === "severe"
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              {n}
              <Tag label={t} type={t} />
            </div>
          ))}
        </div>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-4">
        <StatCard icon={Stethoscope}  value="3"    label="Active Diseases"    ibg="hsl(196,64%,88%)" iclr="hsl(196,64%,32%)" />
        <StatCard icon={Pill}         value="6"    label="Active Medications" ibg="hsl(47,100%,88%)"  iclr="hsl(40,80%,34%)" />
        <StatCard icon={Droplets}     value="0+"   label="Blood Group"        ibg="hsl(0,100%,94%)"   iclr="hsl(0,80%,50%)" />
        <StatCard icon={Activity}     value="24.2" label="BMI"                ibg="hsl(68,56%,88%)"   iclr="hsl(68,56%,30%)" />
      </div>

      {/* Vitals */}
      <Card className="mb-4">
        <SectionHdr icon={HeartPulse}>Last Recorded Vitals</SectionHdr>
        <div className="flex gap-3.5 flex-wrap">
          <VitalCard label="Blood Pressure" value="128/82" unit="mmHg" />
          <VitalCard label="Heart Rate"     value="72"     unit="bpm" />
          <VitalCard label="Blood Sugar"    value="110"    unit="mg/dL" />
          <VitalCard label="Temperature"    value="98.4"   unit="°F" />
        </div>
      </Card>

      {/* Active Conditions */}
      <Card>
        <SectionHdr
          icon={Activity}
          action={
            <span className="text-[12px] text-[hsl(196,64%,50%)] font-semibold cursor-pointer hover:underline">
              View All →
            </span>
          }
        >
          Active Conditions
        </SectionHdr>
        {CONDITIONS.map((c, i) => (
          <div
            key={c.name}
            className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-[hsl(120,12%,83%)]" : ""}`}
          >
            <div className="flex items-center gap-2.5">
              <Activity size={13} className="text-[hsl(196,64%,50%)]" />
              <span className="font-semibold text-[14px]">{c.name}</span>
              <Tag label={c.status} type={c.status} />
            </div>
            <span className="text-[12px] text-[hsl(200,15%,40%)]">{c.meds}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
