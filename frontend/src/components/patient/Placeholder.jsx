import { Menu, Settings } from "lucide-react";

// ─── Topbar (mobile) ──────────────────────────────────────────────────────────
export function Topbar({ onMenuClick }) {
  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[hsl(184,46%,86%)] border-b border-[hsl(120,12%,83%)] sticky top-0 z-[100]">
      <button
        onClick={onMenuClick}
        className="p-1 text-[hsl(200,25%,15%)] hover:bg-[hsl(184,52%,80%)] rounded-lg transition-colors"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[hsl(196,64%,50%)] flex items-center justify-center text-white font-extrabold text-sm">
          Q
        </div>
        <span className="font-extrabold text-base text-[hsl(200,25%,15%)]">Qure</span>
      </div>
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
export default function Placeholder({ title, Icon }) {
  const IconComp = Icon ?? Settings;
  return (
    <div className="flex flex-col items-center justify-center h-[380px] gap-3">
      <div className="w-[54px] h-[54px] rounded-[13px] bg-[hsl(196,64%,88%)] flex items-center justify-center">
        <IconComp size={26} className="text-[hsl(196,64%,50%)]" />
      </div>
      <h2 className="text-[hsl(200,15%,40%)] font-bold text-lg">{title}</h2>
      <p className="text-[hsl(200,15%,40%)] text-[13px]">This page is ready to be built.</p>
    </div>
  );
}
