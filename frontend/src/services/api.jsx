import axios from 'axios';

// Helper function to construct API routes
const getApiUrl = (endpoint) => {
  const baseUrl = 'https://quiz-app-6dcq.onrender.com/api';
  console.log('Constructed URL:', `${baseUrl}${endpoint}`); // Debug
  return `${baseUrl}${endpoint}`;
};

const api = axios.create({
  baseURL: 'https://quiz-app-6dcq.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post(getApiUrl('/auth/register'), data);
export const login = (data) => api.post(getApiUrl('/auth/login'), data);
export const generateQuiz = (data) => api.post(getApiUrl('/quizzes/generate'), data);
export const getQuizzes = () => api.get(getApiUrl('/quizzes'));
export const takeQuiz = (data) => api.post(getApiUrl('/quizzes/take'), data);
export const savePerformance = (data) => api.post(getApiUrl('/analytics'), data);
export const getPerformance = () => api.get(getApiUrl('/analytics'));