import api from "./api";

const normalizePatientPayload = (payload) => {
  if (!payload || typeof payload !== "object") return {};
  const candidate = payload.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    _id: candidate._id || candidate.id || null,
    id: candidate.id || candidate._id || null,
    fullName: candidate.fullName || "",
    email: candidate.email || "",
    phone: candidate.phone || "",
    role: candidate.role || "patient",
  };
};

const loginUser = async (userData) => {
  try {
    const response = await api.post("/auth/login", userData);

    // Save login state
    localStorage.setItem("isloggedIn", "true");

    // Save a flat, consistent patient object for later use.
    const normalizedPatient = normalizePatientPayload(response.data);
    localStorage.setItem("patient", JSON.stringify(normalizedPatient));

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    } else {
      throw { message: error.message || "Something went wrong" };
    }
  }
};

const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    } else {
      throw { message: error.message || "Something went wrong" };
    }
  }
};

export { loginUser, registerUser };