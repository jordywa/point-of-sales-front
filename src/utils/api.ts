import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { auth } from '../firebaseConfig'; // Import auth from firebaseConfig

const authenticatedAxios = axios.create({
    baseURL: `${API_BASE_URL}/api`,
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

authenticatedAxios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token is invalid or expired. Sign out from Firebase.
            // This will trigger onAuthStateChanged in App.tsx and handle the redirect.
            auth.signOut();
        }
        return Promise.reject(error);
    }
);

export default authenticatedAxios;
