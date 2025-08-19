import axios from 'axios';

// Debug to check if environment variable is loaded
// console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Helper function to construct API routes
const getApiUrl = (endpoint) => {
  const baseUrl =  'http://localhost:5000/api';
  console.log('Constructed URL:', `${baseUrl}${endpoint}`); // Debug
  return `${baseUrl}${endpoint}`;
};

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post(getApiUrl('/auth/register'), data);
export const login = (data) => api.post(getApiUrl('/auth/login'), data);
export const generateQuiz = (data) => api.post(getApiUrl('/quiz/generate'), data);
export const getQuizzes = () => api.get(getApiUrl('/quiz'));
export const takeQuiz = (data) => api.post(getApiUrl('/quiz/take'), data);
export const savePerformance = (data) => api.post(getApiUrl('/performance'), data);
export const getPerformance = () => api.get(getApiUrl('/performance'));