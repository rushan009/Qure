import { useState } from "react";
import Sidebar from "../components/patient/Sidebar";
import Placeholder, { Topbar } from "../components/patient/Placeholder";

import ProfilePage from "./user/ProfilePage";
import MedicalPage from "./user/MedicalPage";
import DiseasesPage from "./user/DiseasesPage";
import MedicationsPage from "./user/MedicationsPage";

import { NAV } from "../constants/nav";

export default function UserDashboard() {
  const [page, setPage] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "profile":
        return <ProfilePage />;
      case "medical":
        return <MedicalPage />;
      case "diseases":
        return <DiseasesPage />;
      case "medications":
        return <MedicationsPage />;
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
          className="fixed inset-0 bg-black/25 z-[199] lg:hidden"
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
      <div className="flex-1 lg:ml-[228px] min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-6 sm:p-8 max-w-[1080px] w-full">{renderPage()}</div>
      </div>
    </div>
  );
}