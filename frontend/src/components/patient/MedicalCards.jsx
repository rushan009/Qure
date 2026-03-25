import { Activity, Calendar, ChevronDown, ClipboardList, Pill, AlertTriangle } from "lucide-react";
import { Tag } from "./ui";

// ─── DiseaseRow ───────────────────────────────────────────────────────────────
export function DiseaseRow({ name, code, severity, status, date, doctor, meds }) {
  return (
    <div className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 mb-2.5">
      <div className="flex justify-between items-start">
        <div className="flex gap-2.5 flex-1 min-w-0">
          <Activity size={15} className="text-[hsl(196,64%,50%)] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-bold text-[14px]">{name}</span>
              <span className="text-[11px] text-[hsl(200,15%,40%)] bg-[hsl(184,52%,92%)] px-1.5 py-0.5 rounded-md">
                {code}
              </span>
              <Tag label={severity} type={severity} />
              <Tag label={status} type={status} />
            </div>
            <div className="flex flex-wrap gap-3 text-[12px] text-[hsl(200,15%,40%)] mt-1.5">
              <span className="flex items-center gap-1"><Calendar size={11} /> {date}</span>
              <span>by {doctor}</span>
              <span>{meds}</span>
            </div>
          </div>
        </div>
        <ChevronDown size={15} className="text-[hsl(200,15%,40%)] shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

// ─── MedicationCard ───────────────────────────────────────────────────────────
export function MedicationCard({
  name, dose, type, purpose, schedule,
  by: bp, since, refill, note, noteColor = "text-[hsl(68,56%,40%)]",
}) {
  const t = type?.toLowerCase();
  const tagType =
    t === "supplement" ? "supplement" :
    t === "rx"         ? "rx"         :
    t === "otc"        ? "otc"        : "default";

  return (
    <div className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 mb-2.5">
      <div className="flex gap-2.5">
        <Pill size={15} className="text-[hsl(196,64%,50%)] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-bold text-[14px]">{name}</span>
            {dose && <span className="text-[12px] text-[hsl(200,15%,40%)]">{dose}</span>}
            {type && <Tag label={type} type={tagType} />}
          </div>
          <div className="text-[12px] text-[hsl(200,15%,40%)] mb-1.5">{purpose}</div>
          <div className="flex flex-wrap gap-3 text-[12px] text-[hsl(200,15%,40%)]">
            <span className="flex items-center gap-1"><ClipboardList size={11} /> {schedule}</span>
            <span>by {bp}</span>
            <span>Since {since}</span>
            {refill && (
              <span className="text-[hsl(196,64%,50%)] font-semibold">Refill: {refill}</span>
            )}
          </div>
          {note && (
            <div className={`flex items-center gap-1 text-[12px] italic mt-2 ${noteColor}`}>
              <AlertTriangle size={11} /> {note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
