import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000, 
  withCredentials: true,
});

// Render cold start ke liye retry logic
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('traveloop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Cold start / timeout 
    if (
      !config._retried &&
      (error.code === 'ECONNABORTED' || !error.response)
    ) {
      config._retried = true;
      await sleep(3000); // 3 sec wait karo
      return api(config);
    }

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;