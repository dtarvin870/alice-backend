// Dynamic API configuration for network access
const getApiBase = () => {
    // 1. Check for manual override (good for testing)
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // 2. Production Environment (Deployed Website)
    if (import.meta.env.MODE === 'production') {
        // Updated to your Render URL
        return 'https://alice-backend-yrrj.onrender.com/api';
    }

    // 3. Local Development
    const hostname = window.location.hostname;
    return `http://${hostname}:5000/api`;
};

const getBaseUrl = () => {
    if (import.meta.env.MODE === 'production') {
        return 'https://alice-backend-yrrj.onrender.com';
    }
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
};

export const API_BASE = getApiBase();
export const BASE_URL = getBaseUrl();
export default API_BASE;
