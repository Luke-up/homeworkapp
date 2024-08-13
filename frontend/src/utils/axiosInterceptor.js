import axios from 'axios';

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
        const originalRequest = error.config;
        const refreshToken = sessionStorage.getItem('refresh_token');

        if (error.response.status === 401 && refreshToken) {
            try {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/core/refresh/`, { refresh_token: refreshToken });
                const newAccessToken = response.data.access;
                const newRefreshToken = response.data.refresh;
                sessionStorage.setItem('access_token', newAccessToken);
                sessionStorage.setItem('refresh_token', newRefreshToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('refresh_token');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInterceptor;