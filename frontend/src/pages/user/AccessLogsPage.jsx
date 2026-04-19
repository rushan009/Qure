import { Clock3, Eye, Search, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../service/api";

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const dateText = date.toISOString().slice(0, 10);
  const timeText = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${dateText}  ${timeText}`;
}

function getBadgeClass(type) {
  const value = String(type || "").toLowerCase();

  if (value === "emergency") return "bg-red-100 text-red-600";
  if (value === "direct access") return "bg-slate-200 text-slate-700";
  if (value === "qr scan") return "bg-blue-100 text-blue-600";

  return "bg-slate-200 text-slate-700";
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
        <Icon size={14} className="text-[hsl(196,64%,45%)]" />
      </div>
      <div className="min-w-0">
        <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">{value}</div>
        <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">{label}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,46%,90%)] p-6 text-center text-[13px] text-[hsl(200,15%,40%)]">
      No access logs found yet.
    </div>
  );
}

export default function AccessLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState({
    totalAccesses: 0,
    thisMonth: 0,
    emergencyTriggered: 0,
  });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadAccessLogs() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/auth/access-logs");
        if (!mounted) return;

        setSummary({
          totalAccesses: Number(res?.data?.summary?.totalAccesses || 0),
          thisMonth: Number(res?.data?.summary?.thisMonth || 0),
          emergencyTriggered: Number(res?.data?.summary?.emergencyTriggered || 0),
        });

        setLogs(Array.isArray(res?.data?.logs) ? res.data.logs : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load access logs");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAccessLogs();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return logs;

    return logs.filter((log) => {
      const roleOrSource = log?.type === "access" ? log?.subtitle : "";
      const sectionsText = Array.isArray(log?.sections) ? log.sections.join(" ") : "";

      const searchableFields = [
        log?.name,
        log?.badge,
        log?.type,
        roleOrSource,
        sectionsText,
      ];

      return searchableFields.some((field) =>
        String(field || "").toLowerCase().includes(term)
      );
    });
  }, [logs, query]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] leading-tight font-extrabold text-[hsl(200,25%,15%)]">Access Logs</h1>
        <p className="text-[14px] text-[hsl(200,15%,40%)] mt-1">
          Track who accessed your medical data and when
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <StatCard icon={Eye} value={summary.totalAccesses} label="Total Accesses" />
        <StatCard icon={Clock3} value={summary.thisMonth} label="This Month" />
        <StatCard icon={ShieldAlert} value={summary.emergencyTriggered} label="Emergency" />
      </div>

      <div className="mb-5 relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(200,15%,45%)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor, source, badge, section..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] text-[14px] text-[hsl(200,25%,15%)] placeholder:text-[hsl(200,15%,45%)] outline-none focus:ring-2 focus:ring-[hsl(196,64%,78%)]"
        />
      </div>

      {loading ? (
        <div className="text-[13px] text-[hsl(200,15%,40%)]">Loading access logs...</div>
      ) : error ? (
        <div className="text-[13px] text-red-600">{error}</div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log?.id || `${log?.name}-${log?.happenedAt}`}
              className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[hsl(196,64%,90%)] border border-[hsl(196,64%,82%)] flex items-center justify-center shrink-0">
                  <UserRound size={14} className="text-[hsl(196,64%,42%)]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[23px] leading-none font-bold text-[hsl(200,25%,15%)]">{log?.name || "Unknown"}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getBadgeClass(log?.badge)}`}>
                      {log?.badge || "Access"}
                    </span>
                  </div>

                  <p className="text-[13px] text-[hsl(200,15%,40%)] mt-0.5">{log?.subtitle || "Medical access"}</p>

                  {Array.isArray(log?.sections) && log.sections.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {log.sections.map((item) => (
                        <span
                          key={`${log?.id || log?.name}-${item}`}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(184,52%,92%)] text-[hsl(200,15%,40%)] border border-[hsl(120,12%,83%)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="text-[12px] text-[hsl(200,15%,45%)] mt-2.5 font-medium">
                  
                    {formatDateTime(log?.happenedAt)}
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
