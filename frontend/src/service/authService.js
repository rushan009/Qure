import api from "./api";
const loginUser = async (userData) => {
  try {
    const response = await api.post("/auth/login", userData);
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