// Development: direct call to Flask on port 8000
// Docker/Production: nginx proxies /api/ to backend (empty = relative URL)
const API_BASE_URL = process.env.REACT_APP_API_URL !== undefined
  ? process.env.REACT_APP_API_URL
  : (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export { API_BASE_URL };
