import axios from 'axios';
import { server } from '../server';

const shopAxios = axios.create({
  baseURL: server,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

shopAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('seller_token');
    if (token) {
      config.headers['Seller-Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

shopAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('seller_token');
      window.location.href = '/shop-login';
    }
    return Promise.reject(error);
  }
);

export default shopAxios;
