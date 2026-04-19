import { useState } from "react";
import { registerUser } from "../service/authService";
import { useNavigate } from "react-router-dom";

export const useSignup = (setToast) => {
  const [formData, setFormData] = useState({
    fullName: "",
    identifier: "",
    password: "",
    confirmPassword: "",
    role: "patient",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Update form state
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRoleChange = (roleValue) => {
    setFormData((prev) => ({
      ...prev,
      role: String(roleValue || "").toLowerCase(),
    }));
  };

  console.log(formData);

  // Submit signup form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await registerUser(formData);

      // Use the setToast passed to the hook
      setToast({ type: "success", message: response.message });

      // Redirect after signup
      navigate("/login"); // change this to your route
    } catch (error) {
      setToast({ type: "error", message: error.error || error.message || "Signup failed" });
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleRoleChange, handleSubmit, loading };
};