const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

export { API_BASE_URL };
