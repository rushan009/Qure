import {
  AlertTriangle,
  ClipboardList,
  FileText,
  HeartPulse,
  Home,
  LogOut,
  Pill,
  QrCode,
  Stethoscope,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Placeholder, { Topbar } from "../../components/patient/Placeholder";
import api from "../../service/api";
import AccessLogsPage from "../user/AccessLogsPage";
import DiseasesPage from "../user/DiseasesPage";
import Emergency from "../user/Emergency";
import MedicalPage from "../user/MedicalPage";
import MedicationsPage from "../user/MedicationsPage";
import ProfilePage from "../user/ProfilePage";
import QRpage from "../user/QRpage";
import ReportsPage from "../user/ReportsPage";
import DoctorHomePage from "./DoctorHomePage";
import DoctorPatientsPage from "./DoctorPatientsPage";

const DOCTOR_NAV = [
  { id: "home", Icon: Home, label: "Home" },
  { id: "profile", Icon: User, label: "Profile" },
  { id: "medical", Icon: HeartPulse, label: "Medical Summary" },
  { id: "diseases", Icon: Stethoscope, label: "Diseases" },
  { id: "medications", Icon: Pill, label: "General Medications" },
  { id: "reports", Icon: FileText, label: "Reports" },
  { id: "emergency", Icon: AlertTriangle, label: "Emergency" },
  { id: "qr", Icon: QrCode, label: "QR Code" },
  { id: "access", Icon: ClipboardList, label: "Access Logs" },
  { id: "patients", Icon: Users, label: "Patients" },
];

const SCAN_GRANT_KEY = "qure_view_report_scan_grant";

function resolvePageFromQuery(search) {
  const query = new URLSearchParams(search || "");
  const requested = query.get("page");
  if (!requested) return "home";

  const allowed = new Set(DOCTOR_NAV.map((item) => item.id));
  return allowed.has(requested) ? requested : "home";
}

function DoctorSidebar({ active, onNav, isOpen, onClose }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if API fails, continue local cleanup to force sign-out UX.
    }

    localStorage.removeItem("isloggedIn");
    localStorage.removeItem("patient");
    sessionStorage.removeItem(SCAN_GRANT_KEY);

    onClose?.();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen w-57 z-200
        bg-[hsl(184,46%,86%)] border-r border-[hsl(120,12%,83%)]
        flex flex-col transition-transform duration-250 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      <div className="flex items-center justify-between px-4 pt-4.5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-[9px] bg-[hsl(196,64%,50%)] flex items-center justify-center text-white font-extrabold text-base">
            Q
          </div>
          <span className="font-extrabold text-lg text-[hsl(200,25%,15%)]">Qure</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-1 mt-5 overflow-y-auto">
        {DOCTOR_NAV.map(({ id, Icon, label }) => (
          <button
            key={id}
            onClick={() => {
              onNav(id);
              onClose();
            }}
            className={`
              flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left whitespace-nowrap
              text-[13.5px] font-medium transition-all duration-150 font-['DM_Sans',sans-serif]
              ${
                active === id
                  ? "bg-[hsl(196,64%,50%)] text-white"
                  : "text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] hover:text-[hsl(200,25%,15%)]"
              }
            `}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-2.5 pb-4 pt-2.5 border-t border-[hsl(120,12%,83%)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-left text-[13.5px] font-medium text-[hsl(200,15%,40%)] hover:bg-[hsl(184,52%,80%)] hover:text-[hsl(200,25%,15%)] transition-all duration-150 whitespace-nowrap"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function DoctorDashboard() {
  const location = useLocation();
  const [page, setPage] = useState(() => resolvePageFromQuery(location.search));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "home":
        return <DoctorHomePage />;
      case "profile":
        return <ProfilePage />;
      case "medical":
        return <MedicalPage onViewAllConditions={() => setPage("diseases")} />;
      case "diseases":
        return <DiseasesPage />;
      case "medications":
        return <MedicationsPage />;
      case "reports":
        return <ReportsPage />;
      case "qr":
        return <QRpage />;
      case "emergency":
        return <Emergency />;
      case "access":
        return <AccessLogsPage />;
      case "patients":
        return <DoctorPatientsPage />;
      default: {
        const n = DOCTOR_NAV.find((x) => x.id === page);
        return <Placeholder title={n?.label || "Page"} Icon={n?.Icon} />;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[hsl(184,52%,92%)] font-['DM_Sans',sans-serif] text-[hsl(200,25%,15%)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-199 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <DoctorSidebar
        active={page}
        onNav={setPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-57 min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-6 sm:p-8 max-w-270 w-full">{renderPage()}</div>
      </div>
    </div>
  );
}
