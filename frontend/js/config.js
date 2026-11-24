// Automatically detect if running locally or deployed
const isLocal = window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1" ||
                window.location.protocol === "file:";

// When running locally, use the local FastAPI server (http://127.0.0.1:8000)
// When deployed on Vercel, use the production backend
const API_BASE_URL = isLocal
    ? "http://127.0.0.1:8000"
    : "https://library-management-system-ashy-three-16.vercel.app";
