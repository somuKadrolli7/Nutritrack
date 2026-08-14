import axios from 'axios';

let rawUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nutritrack-qzcm.onrender.com/api';
rawUrl = rawUrl.trim().replace(/\/$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}
const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 35000, // 35 seconds to tolerate Render cold starts
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
