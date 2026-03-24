import axios from 'axios';

const client = axios.create({
  baseURL: '/api'
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('promaint_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('promaint_token');
      localStorage.removeItem('promaint_user');
    }
    return Promise.reject(error);
  }
);

export default client;
