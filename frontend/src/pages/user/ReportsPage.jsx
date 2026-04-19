import {
  Download,
  Eye,
  FileText,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../service/api";

const INITIAL_FORM = {
  title: "",
  category: "Blood Test",
  reportDate: "",
  doctorName: "",
  hospitalName: "",
  notes: "",
  file: null,
};

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toISOString().slice(0, 10);
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function TotalReportsCard({ value }) {
  return (
    <div className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[hsl(196,64%,90%)] border border-[hsl(196,64%,82%)] flex items-center justify-center">
        <FileText size={16} className="text-[hsl(196,64%,42%)]" />
      </div>
      <div>
        <p className="text-[30px] leading-none font-extrabold text-[hsl(200,25%,15%)]">{value}</p>
        <p className="text-[12px] text-[hsl(200,15%,40%)] mt-1">Total Reports</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalReports: 0 });
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [openUpload, setOpenUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/auth/reports");
      setSummary({
        totalReports: Number(res?.data?.summary?.totalReports || 0),
      });
      setReports(Array.isArray(res?.data?.reports) ? res.data.reports : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = reports
      .map((item) => String(item?.category || "").trim())
      .filter(Boolean);

    return ["All", ...Array.from(new Set(categories))];
  }, [reports]);

  const filteredReports = useMemo(() => {
    const term = query.trim().toLowerCase();

    return reports.filter((item) => {
      const category = String(item?.category || "").trim();
      const categoryMatch = activeCategory === "All" || category === activeCategory;

      if (!categoryMatch) return false;
      if (!term) return true;

      const searchable = [
        item?.title,
        item?.category,
        item?.doctorName,
        item?.hospitalName,
        item?.originalFileName,
      ];

      return searchable.some((field) => String(field || "").toLowerCase().includes(term));
    });
  }, [reports, query, activeCategory]);

  const updateForm = (field) => (e) => {
    const value = field === "file" ? e.target.files?.[0] || null : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeUploadModal = () => {
    setOpenUpload(false);
    setForm(INITIAL_FORM);
  };

  const submitUpload = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.category.trim() || !form.reportDate || !form.doctorName.trim() || !form.hospitalName.trim() || !form.file) {
      alert("Please fill all required fields and choose a file.");
      return;
    }

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("category", form.category.trim());
    payload.append("reportDate", form.reportDate);
    payload.append("doctorName", form.doctorName.trim());
    payload.append("hospitalName", form.hospitalName.trim());
    payload.append("notes", form.notes.trim());
    payload.append("file", form.file);

    setSaving(true);
    try {
      await api.post("/auth/reports", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      closeUploadModal();
      await loadReports();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to upload report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-[30px] leading-tight font-extrabold text-[hsl(200,25%,15%)]">Medical Reports</h1>
          <p className="text-[14px] text-[hsl(200,15%,40%)] mt-1">Upload and manage your medical documents</p>
        </div>

        <button
          type="button"
          onClick={() => setOpenUpload(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[hsl(196,64%,50%)] text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-[hsl(196,64%,44%)] transition-colors"
        >
          <Upload size={14} /> Upload Report
        </button>
      </div>

      <div className="mb-4">
        <TotalReportsCard value={summary.totalReports} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-62.5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(200,15%,45%)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] pl-9 pr-3 py-2.5 text-[14px] text-[hsl(200,25%,15%)] placeholder:text-[hsl(200,15%,45%)] outline-none focus:ring-2 focus:ring-[hsl(196,64%,78%)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-auto">
          {categoryOptions.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-3 py-1 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[hsl(196,64%,50%)] border-[hsl(196,64%,50%)] text-white"
                    : "bg-[hsl(184,46%,86%)] border-[hsl(120,12%,83%)] text-[hsl(200,15%,40%)] hover:bg-[hsl(184,50%,84%)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-[13px] text-[hsl(200,15%,40%)]">Loading reports...</div>
      ) : error ? (
        <div className="text-[13px] text-red-600">{error}</div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(120,12%,80%)] bg-[hsl(184,46%,90%)] p-6 text-center text-[13px] text-[hsl(200,15%,40%)]">
          No reports found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report?.id || `${report?.title}-${report?.uploadedAt}`}
              className="rounded-xl border border-[hsl(120,12%,83%)] bg-[hsl(184,46%,86%)] p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-[hsl(196,64%,90%)] border border-[hsl(196,64%,82%)] flex items-center justify-center shrink-0">
                <FileText size={16} className="text-[hsl(196,64%,42%)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[16px] font-bold text-[hsl(200,25%,15%)]">{report?.title || "Untitled Report"}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[hsl(120,12%,83%)] bg-[hsl(184,52%,92%)] text-[hsl(200,15%,40%)] font-semibold">
                    {report?.category || "General"}
                  </span>
                </div>

                <p className="text-[12px] text-[hsl(200,15%,40%)] mt-1">
                  {report?.category || "General"} · {report?.doctorName || "N/A"} · {report?.hospitalName || "N/A"}
                </p>

                <p className="text-[12px] text-[hsl(200,15%,45%)] mt-0.5">
                  {formatDate(report?.reportDate)} · {formatBytes(report?.fileSize)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(`/api/auth/reports/${encodeURIComponent(report?.id || "")}/view`, "_blank", "noopener,noreferrer")}
                  className="w-8 h-8 rounded-lg border border-[hsl(120,12%,83%)] bg-white text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,92%)] flex items-center justify-center"
                  title="View report"
                >
                  <Eye size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => window.open(`/api/auth/reports/${encodeURIComponent(report?.id || "")}/download`, "_blank")}
                  className="w-8 h-8 rounded-lg border border-[hsl(120,12%,83%)] bg-white text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,92%)] flex items-center justify-center"
                  title="Download report"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openUpload ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-3">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[hsl(200,25%,15%)]">Upload Medical Report</h2>
              <button
                type="button"
                onClick={closeUploadModal}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={submitUpload}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Report Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={updateForm("title")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    placeholder="e.g. Complete Blood Count"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={updateForm("category")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    required
                  >
                    <option value="Blood Test">Blood Test</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Report Date *</label>
                  <input
                    type="date"
                    value={form.reportDate}
                    onChange={updateForm("reportDate")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    value={form.doctorName}
                    onChange={updateForm("doctorName")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    placeholder="e.g. Dr. Patel"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Hospital / Lab Name *</label>
                  <input
                    type="text"
                    value={form.hospitalName}
                    onChange={updateForm("hospitalName")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    placeholder="e.g. City Medical Center"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Report File *</label>
                  <input
                    type="file"
                    onChange={updateForm("file")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px]"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    required
                  />
                  <p className="text-[11px] text-[hsl(200,15%,45%)] mt-1">Supported: PDF, JPG, PNG, WEBP, DOC, DOCX (max 10MB)</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[hsl(200,15%,35%)] mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={updateForm("notes")}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-[14px] resize-y"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-[hsl(196,64%,50%)] text-white text-[13px] font-semibold hover:bg-[hsl(196,64%,44%)] disabled:opacity-70"
                >
                  {saving ? "Uploading..." : "Upload Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
