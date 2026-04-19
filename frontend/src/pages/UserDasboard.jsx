import { useState } from "react";
import Sidebar from "../components/patient/Sidebar";
import Placeholder, { Topbar } from "../components/patient/Placeholder";
import { useLocation } from "react-router-dom";

import ProfilePage from "./user/ProfilePage";
import MedicalPage from "./user/MedicalPage";
import DiseasesPage from "./user/DiseasesPage";
import MedicationsPage from "./user/MedicationsPage";
import ReportsPage from "./user/ReportsPage";
import QRpage from "./user/QRpage";
import Emergnecy from "./user/Emergency";
import AccessLogsPage from "./user/AccessLogsPage";
import HomePage from "./user/HomePage";
import { NAV } from "../constants/nav";

function resolvePageFromQuery(search) {
  const query = new URLSearchParams(search || "");
  const requested = query.get("page");
  if (!requested) return "home";

  const allowed = new Set(NAV.map((item) => item.id));
  return allowed.has(requested) ? requested : "home";
}

export default function UserDashboard() {
  const location = useLocation();
  const [page, setPage] = useState(() => resolvePageFromQuery(location.search));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "home":
        return <HomePage onNavigate={setPage} />;
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
        return <Emergnecy />;
      case "access":
        return <AccessLogsPage />;
      default: {
        const n = NAV.find((x) => x.id === page);
        return <Placeholder title={n?.label || "Page"} Icon={n?.Icon} />;
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[hsl(184,52%,92%)] font-['DM_Sans',sans-serif] text-[hsl(200,25%,15%)]">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/25 z-199 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        active={page}
        onNav={setPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 lg:ml-57 min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-6 sm:p-8 max-w-270 w-full">{renderPage()}</div>
      </div>
    </div>
  );
}