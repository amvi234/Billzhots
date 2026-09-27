import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ApiErrorType } from './enums';
import { ApiErrorResponse, ApiResponse, RefreshTokenResponse } from './types';
import { logout } from './helpers';
import { localStorageManager } from '@/app/lib/utils';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiErrorResponse;
    defaultSuccess: ApiResponse;
  }
}
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorageManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
  (error) => {
    return Promise.reject(error);
  }
)

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  const refreshToken = localStorageManager.getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(null);
  }

  refreshPromise ??= axios
    .post<RefreshTokenResponse>(`${apiBaseUrl}/auth/token/refresh/`, {
      refresh: refreshToken,
    })
    .then((res) => {
      localStorageManager.setToken(res.data.access);
      return res.data.access;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.response.use(
  (res) => res.data,
  async (error): Promise<ApiErrorResponse | null> => {
    let errorResponse: ApiErrorResponse | null;
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest?.headers?.Authorization
    ) {
      if (!originalRequest._retried) {
        originalRequest._retried = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      }

      logout();
      return Promise.reject({
        meta: {
          type: ApiErrorType.Unauthorized,
          status_code: 401,
          message: 'Your session has expired. Please log in again.',
        },
        data: {},
      });
    }

    if (error.response?.status >= 500) {
      errorResponse = {
        meta: {
          type: ApiErrorType.ServerError,
          status_code: error.response.status,
          message: 'Something went wrong, please try again later.',
        },
        data: {},
      };
    } else if (error.message === 'Network Error') {
      errorResponse = {
        meta: {
          type: ApiErrorType.NetworkError,
          status_code: 503,
          message:
            'Network Error Occurred. Please check your internet connection and try again later.',
        },
        data: {},
      };
    } else if (error.response?.data) {
      errorResponse = error.response.data;

      switch (errorResponse?.meta?.type) {
        case ApiErrorType.AuthenticationFailed:
        case ApiErrorType.TokenBlacklisted:
          logout();
          break;
      }
    } else {
      errorResponse = {
        meta: {
          type: ApiErrorType.SystemError,
          status_code: 500,
          message: error.message,
        },
        data: {},
      };
    }

    return Promise.reject(errorResponse);
  },
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Expired tokens are refreshed in the response interceptor instead.
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

export default api;
