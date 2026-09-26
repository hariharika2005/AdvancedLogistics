import axios from "axios";
import { getToken } from "./auth";

// Prefer VITE_API_BASE if provided, otherwise derive from current host
const defaultBase = (typeof window !== 'undefined' && window.location?.hostname)
  ? `http://${window.location.hostname}:5000/api`
  : "http://10.10.108.210:5000/api";
const apiBase = import.meta?.env?.VITE_API_BASE || defaultBase;

const api = axios.create({
  baseURL: apiBase
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
