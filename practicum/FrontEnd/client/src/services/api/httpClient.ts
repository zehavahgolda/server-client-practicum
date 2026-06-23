import axios from "axios";

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT || 10000),
  headers: {
    "Content-Type": "application/json"
  }
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data || error?.message || "Unknown API error";
    return Promise.reject(new Error(String(message)));
  }
);

export default httpClient;
