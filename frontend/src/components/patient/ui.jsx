// ─── Tag ─────────────────────────────────────────────────────────────────────
const TAG_STYLES = {
  severe:     "bg-red-100 text-red-600",
  moderate:   "bg-red-100 text-red-600",
  mild:       "bg-yellow-100 text-yellow-700",
  managed:    "bg-green-100 text-green-700",
  active:     "bg-blue-100 text-blue-700",
  resolved:   "bg-gray-100 text-gray-600",
  supplement: "bg-amber-100 text-amber-800",
  donor:      "bg-yellow-100 text-yellow-700",
  rx:         "bg-sky-100 text-sky-700",
  otc:        "bg-[hsl(184,46%,86%)] text-[hsl(200,15%,40%)]",
  default:    "bg-sky-100 text-[hsl(200,25%,15%)]",
};

export const Tag = ({ label, type = "default" }) => {
  const cls = TAG_STYLES[type?.toLowerCase()] ?? TAG_STYLES.default;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-wide whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

// ─── Field ────────────────────────────────────────────────────────────────────
export const Field = ({ label, value }) => (
  <div className="mb-3">
    <div className="text-[11px] text-[hsl(200,15%,40%)] font-medium tracking-wide mb-0.5">{label}</div>
    <div className="text-sm text-[hsl(200,25%,15%)] font-semibold">{value}</div>
  </div>
);

// ─── SectionHdr ───────────────────────────────────────────────────────────────
export const SectionHdr = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between mb-3.5">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-[hsl(196,64%,50%)] shrink-0" />
      <span className="font-bold text-[14.5px] text-[hsl(200,25%,15%)]">{children}</span>
    </div>
    {action}
  </div>
);

// ─── Btn ──────────────────────────────────────────────────────────────────────
export const Btn = ({ icon: Icon, label, primary, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-85 ${
      primary
        ? "bg-[hsl(196,64%,50%)] text-white border-transparent"
        : "bg-[hsl(196,64%,88%)] text-[hsl(200,25%,15%)] border-[hsl(196,64%,72%)]"
    }`}
  >
    {Icon && <Icon size={14} />}
    {label}
  </button>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, value, label, ibg, iclr }) => (
  <div className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-[18px_14px] flex flex-col items-center gap-1">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1" style={{ background: ibg }}>
      <Icon size={15} color={iclr} />
    </div>
    <span className="text-[22px] font-extrabold text-[hsl(200,25%,15%)]">{value}</span>
    <span className="text-[11px] text-[hsl(200,15%,40%)] font-medium text-center">{label}</span>
  </div>
);

// ─── VitalCard ────────────────────────────────────────────────────────────────
export const VitalCard = ({ label, value, unit }) => (
  <div className="bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex-1 min-w-0">
    <div className="text-[11px] text-[hsl(200,15%,40%)] font-medium mb-1.5">{label}</div>
    <div className="text-[22px] font-extrabold text-[hsl(200,25%,15%)]">{value}</div>
    <div className="text-[11px] text-[hsl(200,15%,40%)] mt-0.5">{unit}</div>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = "", style }) => (
  <div
    className={`bg-[hsl(184,46%,91%)] border border-[hsl(120,12%,83%)] rounded-xl p-5 ${className}`}
    style={style}
  >
    {children}
  </div>
);

// ─── PageHeader ───────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
    <div>
      <h1 className="text-[22px] font-extrabold">{title}</h1>
      {subtitle && <p className="text-[13px] text-[hsl(200,15%,40%)] mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── LabelXS ─────────────────────────────────────────────────────────────────
export const LabelXS = ({ children, className = "" }) => (
  <div className={`text-[11px] font-bold tracking-[1px] text-[hsl(200,15%,40%)] uppercase mb-3 flex items-center gap-1.5 ${className}`}>
    {children}
  </div>
);
