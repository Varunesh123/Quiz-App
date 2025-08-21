import axios from 'axios';

// Helper function to construct API routes
const getApiUrl = (endpoint) => {
  const baseUrl = 'https://quiz-app-6dcq.onrender.com/api'; // Use the environment variable if needed
  console.log('Constructed URL:', `${baseUrl}${endpoint}`); // Debug
  return `${baseUrl}${endpoint}`;
};

const api = axios.create({
  baseURL: 'https://quiz-app-6dcq.onrender.com/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post(getApiUrl('/auth/register'), data);
export const login = (data) => api.post(getApiUrl('/auth/login'), data);
export const generateQuiz = (data) => api.post(getApiUrl('/quizzes/create-quiz'), data); // Updated to match backend POST /quizzes
export const getQuizzes = () => api.get(getApiUrl('/quizzes'));
export const startQuiz = (id) => api.post(getApiUrl(`/quizzes/${id}/start`));
export const submitQuiz = (id, data) => api.post(getApiUrl(`/quizzes/${id}/submit`), data);
export const getPerformance = () => api.get(getApiUrl('/analytics/user')); // Updated to /analytics/user