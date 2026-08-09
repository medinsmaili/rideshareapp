import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let authToken: string | null = null;

const client = axios.create({
  baseURL: 'https://api.nisu.app',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let unauthorizedHandler: (() => void) | null = null;
let isHandling401 = false;

export const setClientToken = (token: string | null) => {
  authToken = token;
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token.trim()}`;
  } else {
    delete client.defaults.headers.common['Authorization'];
  }
};

export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

client.interceptors.request.use(async (config) => {
  if (!authToken) {
    authToken = await AsyncStorage.getItem('user_token');
  }
  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken.trim()}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      if (!isHandling401 && unauthorizedHandler) {
        isHandling401 = true;
        unauthorizedHandler();
        setTimeout(() => { isHandling401 = false; }, 5000);
      }
    }
    return Promise.reject(err);
  }
);

export default client;
