import axios from 'axios';


const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // send HTTP-only cookies
});
export default api  