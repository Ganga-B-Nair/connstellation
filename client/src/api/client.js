import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_URL || ''}/api`;

export const api = axios.create({ baseURL });

/** Attach the JWT on every request. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('connstellation_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalise server errors into something a component can render directly. */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.details?.[0]?.message ||
      err.message ||
      'Something went wrong';
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status }));
  }
);

export default api;
