import { useEffect, useState } from "react";

export function useDiseaseList() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDiseases = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/disease", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const failData = await response.json().catch(() => ({}));
        throw new Error(failData?.error || "Failed to load diseases");
      }

      const data = await response.json();
      setDiseases(Array.isArray(data?.diseases) ? data.diseases : []);
    } catch (err) {
      setError(err.message || "Failed to load diseases");
    } finally {
      setLoading(false);
    }
  };

  const createDisease = async (payload) => {
    const response = await fetch("/api/auth/disease", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const failData = await response.json().catch(() => ({}));
      throw new Error(failData?.error || "Failed to add disease");
    }

    return response.json();
  };

  const removeDisease = async (diseaseId) => {
    const response = await fetch(`/api/auth/disease/${diseaseId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const failData = await response.json().catch(() => ({}));
      throw new Error(failData?.error || "Failed to delete disease");
    }

    return response.json();
  };

  const updateDisease = async (diseaseId, payload) => {
    const response = await fetch(`/api/auth/disease/${diseaseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const failData = await response.json().catch(() => ({}));
      throw new Error(failData?.error || "Failed to update disease");
    }

    return response.json();
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  return {
    diseases,
    loading,
    error,
    fetchDiseases,
    createDisease,
    updateDisease,
    removeDisease,
  };
}
