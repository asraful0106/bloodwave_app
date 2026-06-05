import type { AxiosInstance } from "axios";
import { create } from "axios";
import { envVars } from "./envVars";

const BASE_URL = envVars.BASE_URL;

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
