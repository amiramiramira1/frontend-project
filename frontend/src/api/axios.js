import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('boxify_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Set Accept-Language header for backend localization
  const lng = localStorage.getItem('i18nextLng') || 'en';
  config.headers['Accept-Language'] = lng;
  
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Format validation errors nicely for display
    if (
      err.response?.status === 400 &&
      err.response?.data?.message === 'Validation failed' &&
      Array.isArray(err.response?.data?.errors)
    ) {
      const messages = err.response.data.errors.map((e) => e.message);
      err.response.data.message = messages.join('. ');
    }

    const isAuthRequest = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');
    
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('boxify_token');
      localStorage.removeItem('boxify_user');
      
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;