import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";

const SCAN_GRANT_KEY = "qure_view_report_scan_grant";

function grantScan(patientId) {
  sessionStorage.setItem(
    SCAN_GRANT_KEY,
    JSON.stringify({
      patientId: String(patientId || "").trim(),
      issuedAt: Date.now(),
    })
  );
}

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

  return `${dateText} ${timeText}`;
}

export default function DoctorPatientsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadPatients() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/auth/doctor/scanned-patients");
        if (!mounted) return;

        setTotal(Number(res?.data?.total || 0));
        setRows(Array.isArray(res?.data?.patients) ? res.data.patients : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load treated patients");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPatients();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((item) => {
      const values = [
        item?.patientId,
        item?.patientName,
        item?.patientEmail,
        item?.patientPhone,
        item?.bloodGroup,
      ];

      return values.some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [query, rows]);

  const totalChecks = useMemo(
    () => rows.reduce((sum, item) => sum + Number(item?.totalChecks || 0), 0),
    [rows]
  );

  const openPatient = (patientId) => {
    const id = String(patientId || "").trim();
    if (!id) return;

    grantScan(id);
    navigate(`/view-report/${encodeURIComponent(id)}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[30px] leading-tight font-extrabold text-[hsl(200,25%,15%)]">Treated Patients</h1>
        <p className="text-[14px] text-[hsl(200,15%,40%)] mt-1">
          Patients scanned and treated by you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
            <Users size={14} className="text-[hsl(196,64%,45%)]" />
          </div>
          <div>
            <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">{total}</div>
            <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Total Patients Treated</div>
          </div>
        </div>

        <div className="bg-[hsl(184,46%,86%)] border border-[hsl(120,12%,83%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(196,64%,88%)] flex items-center justify-center shrink-0">
            <Users size={14} className="text-[hsl(196,64%,45%)]" />
          </div>
          <div>
            <div className="text-[28px] leading-none font-extrabold text-[hsl(200,25%,15%)]">{totalChecks}</div>
            <div className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Total Patient Checks</div>
          </div>
        </div>
      </div>

      <div className="mb-5 relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(200,15%,45%)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by patient ID, name, email, phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] text-[14px] text-[hsl(200,25%,15%)] placeholder:text-[hsl(200,15%,45%)] outline-none focus:ring-2 focus:ring-[hsl(196,64%,78%)]"
        />
      </div>

      {loading ? (
        <div className="text-[13px] text-[hsl(200,15%,40%)]">Loading treated patients...</div>
      ) : error ? (
        <div className="text-[13px] text-red-600">{error}</div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,46%,90%)] p-6 text-center text-[13px] text-[hsl(200,15%,40%)]">
          No treated patients found yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-5 overflow-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="text-[hsl(200,15%,40%)] border-b border-[hsl(120,12%,83%)]">
                <th className="py-2.5 pr-3 font-semibold">Patient ID</th>
                <th className="py-2.5 pr-3 font-semibold">Patient Name</th>
                <th className="py-2.5 pr-3 font-semibold">Checks</th>
                <th className="py-2.5 pr-3 font-semibold">Last Checked</th>
                <th className="py-2.5 pr-3 font-semibold">Last Access</th>
                <th className="py-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.patientId} className="border-b border-[hsl(120,12%,83%)]/60">
                  <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{item?.patientId || "N/A"}</td>
                  <td className="py-2.5 pr-3 text-[hsl(200,25%,15%)] font-medium">{item?.patientName || "Unknown"}</td>
                  <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{item?.totalChecks || 0}</td>
                  <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{formatDateTime(item?.lastCheckedAt)}</td>
                  <td className="py-2.5 pr-3 text-[hsl(200,15%,40%)]">{item?.lastAccessLevel || "limited"}</td>
                  <td className="py-2.5">
                    <button
                      type="button"
                      onClick={() => openPatient(item?.patientId)}
                      className="rounded-lg border border-[hsl(120,12%,83%)] bg-white px-2.5 py-1 text-[12px] font-semibold text-[hsl(200,15%,35%)] hover:bg-[hsl(184,52%,92%)]"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
