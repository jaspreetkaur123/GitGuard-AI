import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for Passport session cookies
});

export const authService = {
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
};

export const repoService = {
  getRepos: () => api.get('/api/repositories'),
  updateRepo: (id, data) => api.patch(`/api/repositories/${id}`, data),
};

export const logService = {
  getLogs: () => api.get('/api/logs'),
};

export default api;
