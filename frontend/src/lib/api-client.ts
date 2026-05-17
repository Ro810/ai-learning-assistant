// Axios instance with JWT interceptor reading from localStorage.
// All API calls go through here so auth is centralized.

import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'ai-learning-token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
};

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request when present.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the token ONLY when the failure is actually a token problem
// (missing / invalid / expired). Endpoints like change-password and
// change-email also return 401 when the *user-supplied* password is wrong —
// those must not log the user out.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const msg =
        (error.response?.data as { message?: string } | undefined)?.message ?? '';
      const isTokenIssue = /token|access denied/i.test(msg);
      if (isTokenIssue) clearToken();
    }
    return Promise.reject(error);
  },
);

// Extract a user-friendly error message from an axios error.
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ message: string }> }
      | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message).join(', ');
    }
    return data?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Đã có lỗi xảy ra';
};
