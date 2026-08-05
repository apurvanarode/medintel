import axios from "axios";

const API_BASE = "https://medintel-backend-p6ct.onrender.com";

export const api = axios.create({
  baseURL: API_BASE,
});