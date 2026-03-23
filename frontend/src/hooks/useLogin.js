import { useState } from "react";   
import { loginUser } from "../service/authService";
import { useNavigate } from "react-router-dom";

export const useLogin = (setToast) => {
  const [formData, setFormData] = useState({  
    identifier: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Update form state
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  console.log(formData);
  

  // Submit login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginUser(formData);

      // Use the setToast passed to the hook
      setToast({ type: "success", message: response.message });

      // Redirect after login
      navigate("/dashboard"); // change this to your route
    } catch (error) {
      setToast({ type: "error", message: error.error || error.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return { formData, handleChange, handleSubmit, loading };
};