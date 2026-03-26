import React from "react";
import Index from "../src/pages/Index";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { SignUp } from "./pages/Signup";
import { useState } from "react";
import { CustomToast } from "./components/ui/CustomToast";
import { Login } from "./pages/Login";
import UserDasboard from "./pages/UserDasboard";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import ProtectedRoute from "../ProtectedRoute";
const App = () => {
  const [toast, setToast] = useState(null);

  return (
    <BrowserRouter>
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
        {toast && (
          <CustomToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<SignUp setToast={setToast} />} />
        <Route path="/login" element={<Login setToast={setToast} />} />

        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDasboard />
            </ProtectedRoute>
          }
        />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
