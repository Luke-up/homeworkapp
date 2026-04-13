import axios from 'axios';
import { clearTimedDemoLocalState } from '@/utils/timedDemo';

const axiosInterceptor = axios.create({
    baseURL: process.env.NEXT_PUBLIC_FRONTEND_URL,
});

axiosInterceptor.interceptors.request.use(
    (config) => {
        const accessToken = sessionStorage.getItem('access_token');

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);
axiosInterceptor.interceptors.response.use(
    (response) => response,
    async (error) => {
        const demoCode = error.response?.data?.code;
        if (demoCode === 'demo_expired') {
            clearTimedDemoLocalState();
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/signup?demo_expired=1';
            return Promise.reject(error);
        }

        const originalRequest = error.config;
        const refreshToken = sessionStorage.getItem('refresh_token');

        if (error.response?.status === 401 && refreshToken) {
            try {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/refresh/`, { refresh_token: refreshToken });
                const newAccessToken = response.data.access;
                const newRefreshToken = response.data.refresh;
                sessionStorage.setItem('access_token', newAccessToken);
                sessionStorage.setItem('refresh_token', newRefreshToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                if (refreshError.response?.data?.code === 'demo_expired') {
                    clearTimedDemoLocalState();
                }
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                window.location.href =
                    refreshError.response?.data?.code === 'demo_expired'
                        ? '/signup?demo_expired=1'
                        : '/';
                return Promise.reject(refreshError);
            }
        }

        const st = error.response?.status;
        if (st === 403 || st === 401 || st === 404) {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default axiosInterceptor;