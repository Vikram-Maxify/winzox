// api.js
import axios from "axios";

// const API_BASE_URL = "http://localhost:5007/api";
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",

    // ✅ NO CACHE
    "Cache-Control": "no-cache, no-store, must-revalidate",

    Pragma: "no-cache",

    Expires: "0",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    // ✅ prevent browser cache

    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";

    config.headers.Pragma = "no-cache";

    config.headers.Expires = "0";

    // ✅ unique request
    config.params = {
      ...(config.params || {}),

      _t: Date.now(),
    };

    return config;
  },

  (error) => Promise.reject(error),
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      // Ignore guest profile checks

      const isProfileCheck = error.config?.url?.includes("/auth/profile");

      if (
        !isProfileCheck &&
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

const host = "https://demo22.etsblokchain.live/";

export { api, host };
