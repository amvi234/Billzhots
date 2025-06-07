import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ApiErrorType } from './enums';
import { ApiErrorResponse, ApiResponse, RefreshTokenResponse } from './types';
import { localStorageManager } from '@/app/lib/utils';
import { logout } from './helpers';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiErrorResponse;
    defaultSuccess: ApiResponse;
  }
}
const BACKEND_URL ='http://localhost:8000';

  const api = axios.create({
    baseURL: BACKEND_URL,
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

api.interceptors.response.use(
  (res) => res.data,
  async (error): Promise<ApiErrorResponse | null> => {
    let errorResponse: ApiErrorResponse | null;

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

export const handleRefreshToken = async () => {
  try {
    const refreshToken = localStorageManager.getRefreshToken();
    if (refreshToken) {
      const res = await api.post<
        Record<string, string>,
        ApiResponse<RefreshTokenResponse>
      >('/accounts/token/refresh/', {
        refresh: refreshToken,
      });

      if (res.data.access) {
        localStorageManager.setToken(res.data.access);
      }
    } else {
      logout();
    }
  } catch (e: any) {
    if (e.meta?.type === ApiErrorType.TokenError) {
      logout();
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (_, error) => {
        if (error.meta?.type === ApiErrorType.TokenError) {
          handleRefreshToken();
          return true;
        }
        return false;
      },
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      gcTime: 0,
    },
    mutations: {
      retry: (_, error) => {
        if (error.meta?.type === ApiErrorType.TokenError) {
          handleRefreshToken();
          return true;
        }
        return false;
      },
    },
  },
});

export default api;
