import {
  Activity,
  FileText,
  Pill,
  QrCode,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../service/api";

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">
            {value}
          </div>
          <p className="text-[13px] text-[hsl(200,15%,40%)] mt-1">{label}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[hsl(196,64%,90%)] border border-[hsl(196,64%,82%)] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-[hsl(196,64%,42%)]" />
        </div>
      </div>
    </div>
  );
}

function ActivityToneDot({ tone }) {
  if (tone === "danger") {
    return <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />;
  }

  if (tone === "warning") {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />;
  }

  return <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />;
}

function firstName(value) {
  const text = String(value || "").trim();
  if (!text) return "there";

  const [name] = text.split(" ");
  return name || "there";
}

export default function HomePage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    greetingName: "",
    stats: {
      activeConditions: 0,
      medications: 0,
      reports: 0,
      accessLogs: 0,
    },
    profileSummary: {
      bloodGroup: "N/A",
      criticalAllergies: "N/A",
      keyConditions: "N/A",
      emergencyContact: "N/A",
    },
    qr: {
      patientCode: "N/A",
    },
    recentActivity: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadHomeSummary() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/auth/home-summary");
        if (!mounted) return;
        setData((prev) => ({
          ...prev,
          ...res.data,
          stats: {
            ...prev.stats,
            ...(res.data?.stats || {}),
          },
          profileSummary: {
            ...prev.profileSummary,
            ...(res.data?.profileSummary || {}),
          },
          qr: {
            ...prev.qr,
            ...(res.data?.qr || {}),
          },
          recentActivity: Array.isArray(res.data?.recentActivity)
            ? res.data.recentActivity
            : [],
        }));
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load home data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHomeSummary();

    return () => {
      mounted = false;
    };
  }, []);

  const greeting = useMemo(() => firstName(data.greetingName), [data.greetingName]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] leading-tight font-extrabold text-[hsl(200,25%,15%)]">
          Welcome back, {greeting}
        </h1>
        <p className="text-[14px] text-[hsl(200,15%,40%)] mt-1">
          Here is your health and access overview for today.
        </p>
      </div>

      {loading ? (
        <div className="text-[13px] text-[hsl(200,15%,40%)]">Loading home summary...</div>
      ) : error ? (
        <div className="text-[13px] text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <StatCard icon={Activity} value={data.stats.activeConditions} label="Active Conditions" />
            <StatCard icon={Pill} value={data.stats.medications} label="Current Medications" />
            <StatCard icon={FileText} value={data.stats.reports} label="Total Reports" />
            <StatCard icon={ShieldCheck} value={data.stats.accessLogs} label="Access Events" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="lg:col-span-2 rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-[18px] font-bold text-[hsl(200,25%,15%)]">Profile Summary</h2>
                <button
                  type="button"
                  onClick={() => onNavigate?.("profile")}
                  className="text-[13px] font-semibold text-[hsl(196,64%,42%)] hover:underline"
                >
                  View Full
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[hsl(200,15%,45%)]">Blood Group</p>
                  <p className="text-[16px] font-bold text-[hsl(200,25%,15%)] mt-1">{data.profileSummary.bloodGroup}</p>
                </div>

                <div className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[hsl(200,15%,45%)]">Emergency Contact</p>
                  <p className="text-[16px] font-bold text-[hsl(200,25%,15%)] mt-1 line-clamp-2">{data.profileSummary.emergencyContact}</p>
                </div>

                <div className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[hsl(200,15%,45%)]">Critical Allergies</p>
                  <p className="text-[14px] font-semibold text-[hsl(200,25%,15%)] mt-1 line-clamp-2">{data.profileSummary.criticalAllergies}</p>
                </div>

                <div className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-[hsl(200,15%,45%)]">Key Conditions</p>
                  <p className="text-[14px] font-semibold text-[hsl(200,25%,15%)] mt-1 line-clamp-2">{data.profileSummary.keyConditions}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.("qr")}
              className="text-left rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-5 hover:bg-[hsl(184,48%,84%)] transition-colors"
            >
              <h2 className="text-[18px] font-bold text-[hsl(200,25%,15%)] mb-3">My QR</h2>

              <div className="rounded-2xl border border-[hsl(196,64%,82%)] bg-[hsl(196,64%,90%)] p-5 flex items-center justify-center mb-3">
                <QrCode size={54} className="text-[hsl(196,64%,42%)]" />
              </div>

              <p className="text-[12px] uppercase tracking-wide text-[hsl(200,15%,45%)]">Patient Code</p>
              <p className="text-[17px] font-bold text-[hsl(200,25%,15%)] mt-1">{data.qr.patientCode}</p>
              <p className="text-[13px] text-[hsl(200,15%,40%)] mt-2">Tap to open and share your QR report.</p>
            </button>
          </div>

          <div className="rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-[18px] font-bold text-[hsl(200,25%,15%)]">Recent Activity</h2>
              <button
                type="button"
                onClick={() => onNavigate?.("access")}
                className="text-[13px] font-semibold text-[hsl(196,64%,42%)] hover:underline"
              >
                View Access Logs
              </button>
            </div>

            {data.recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,52%,92%)] p-5 text-[13px] text-[hsl(200,15%,40%)]">
                No recent activity yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((item) => (
                  <div
                    key={item?.id || `${item?.title}-${item?.occurredAt}`}
                    className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <ActivityToneDot tone={item?.tone} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[hsl(200,25%,15%)] line-clamp-1">{item?.title || "Activity"}</p>
                        <p className="text-[12px] text-[hsl(200,15%,40%)] mt-0.5 line-clamp-2">{item?.subtitle || ""}</p>
                      </div>
                      <span className="text-[11px] text-[hsl(200,15%,45%)] whitespace-nowrap">{item?.timeAgo || "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-5 rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-3 flex items-start gap-2.5">
        <TriangleAlert size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[12px] text-[hsl(200,15%,40%)]">
          Keep emergency contact details and allergies updated for better care during urgent situations.
        </p>
      </div>
    </div>
  );
}
