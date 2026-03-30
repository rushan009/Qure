import { Activity, Calendar, ChevronDown, ClipboardList, Pill, AlertTriangle } from "lucide-react";
import {  Clock, User, Tag as TagIcon, FileText, Trash2 } from "lucide-react";
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




const categoryStyles = {
  "Prescription (Rx)": "bg-blue-100 text-blue-700",
  "OTC":               "bg-green-100 text-green-700",
  "Supplement":        "bg-yellow-100 text-yellow-700",
};

export function MedicationCard({ medication, onDelete }) {
  const {
    _id,
    name,
    dose,
    frequency,
    purpose,
    prescribedBy,
    category,
    startDate,
    instructions,
  } = medication;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow w-full">

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="bg-[hsl(184,46%,91%)] p-1.5 sm:p-2 rounded-xl shrink-0">
            <Pill size={14} className="text-[hsl(196,64%,45%)] sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[14px] sm:text-[15px] text-gray-900 leading-tight truncate">{name}</p>
            {dose && <p className="text-[11px] sm:text-[12px] text-gray-400 mt-0.5">{dose}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {category && (
            <span className={`text-[10px] sm:text-[11px] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${categoryStyles[category] ?? "bg-gray-100 text-gray-600"}`}>
              {/* Short label on mobile, full on sm+ */}
              <span className="sm:hidden">
                {category === "Prescription (Rx)" ? "Rx" : category}
              </span>
              <span className="hidden sm:inline">{category}</span>
            </span>
          )}
          <button
            onClick={() => onDelete(_id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-3" />

      {/* Meta grid — 1 col on mobile, 2 col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[12px] text-gray-500">

        {frequency && (
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="shrink-0 text-[hsl(196,64%,45%)]" />
            <span className="truncate">{frequency}</span>
          </div>
        )}

        {prescribedBy && (
          <div className="flex items-center gap-1.5">
            <User size={11} className="shrink-0 text-[hsl(196,64%,45%)]" />
            <span className="truncate">{prescribedBy}</span>
          </div>
        )}

        {purpose && (
          <div className="flex items-center gap-1.5 sm:col-span-2">
            <TagIcon size={11} className="shrink-0 text-[hsl(196,64%,45%)]" />
            <span className="line-clamp-2">{purpose}</span>
          </div>
        )}

        {startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="shrink-0 text-[hsl(196,64%,45%)]" />
            <span>
              Since {new Date(startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}

      </div>

      {/* Instructions */}
      {instructions && (
        <div className="mt-3 flex items-start gap-1.5 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
          <FileText size={11} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[11px] sm:text-[12px] text-yellow-700 italic line-clamp-3 sm:line-clamp-none">{instructions}</p>
        </div>
      )}

    </div>
  );
}