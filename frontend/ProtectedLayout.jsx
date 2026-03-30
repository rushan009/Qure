import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAccidentDetection from "./src/hooks/useAccidentDetection";
import AccidentAlertModal from "../frontend/src/components/AccidentAlertModal";
import api from "./src/service/api"; // adjust path if needed

const ProtectedLayout = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // 1. Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/profile");
        setIsAuth(true);
      } catch (err) {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 2. Start Accident Detection (Only runs if isAuth is true)
  const { accidentDetected, alertSent, cancelAlert, sendAlert } = useAccidentDetection(isAuth);

  if (loading) return <div>Loading...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <>
      {/* Global Alert Modal */}
      <AccidentAlertModal
        key={accidentDetected ? "active" : "idle"}
        accidentDetected={accidentDetected}
        alertSent={alertSent}
        cancelAlert={cancelAlert}
        sendAlert={sendAlert}
      />

      {/* This renders the specific page (Dashboard, Profile, etc.) */}
      <Outlet />
    </>
  );
};

export default ProtectedLayout;