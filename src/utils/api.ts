import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';

const authenticatedAxios = axios.create({
    baseURL: API_BASE_URL,
});

authenticatedAxios.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default authenticatedAxios;
