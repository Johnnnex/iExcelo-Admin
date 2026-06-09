"use client";

import axios, {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { API_URL, X_API_KEY } from "@/src/utils";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "x-api-key": X_API_KEY },
});

// Attach Bearer token from admin auth store on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      // Lazy import to avoid circular dep — read persisted zustand state directly
      const raw = localStorage.getItem("admin-auth");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
          const token = parsed?.state?.accessToken;
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch {
          // ignore
        }
      }
    }
    return config;
  },
);

// On 401 clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authRequest = <T = unknown>(config: AxiosRequestConfig) =>
  api.request<T>(config);
