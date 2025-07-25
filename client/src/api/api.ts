import axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import JSONbig from 'json-bigint';



const localApi = axios.create({
  validateStatus: (status) => {
    return status >= 200 && status < 300;
  },
  transformResponse: [(data) => {
    try {
      if (typeof data === 'string') {
        return JSONbig.parse(data);
      }
      return data;
    } catch (e) {
      return data; // Keep original data if parsing fails
    }
  }]
});



let accessToken: string | null = null;

const getApiInstance = (url: string) => {
  return localApi;
};

const isAuthEndpoint = (url: string): boolean => {
  return url.includes("/api/auth");
};

// Check if the URL is for the refresh token endpoint to avoid infinite loops
const isRefreshTokenEndpoint = (url: string): boolean => {
  return url.includes("/api/auth/refresh");
};

const setupInterceptors = (apiInstance: typeof axios) => {
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);

      if (!accessToken) {
        accessToken = localStorage.getItem('accessToken');
        console.log(`[API Request] Retrieved accessToken from localStorage: ${accessToken ? 'EXISTS' : 'NULL'}`);
      }
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log(`[API Request] Added Authorization header`);
      }

      return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
      console.error(`[API Request Error]`, error);
      return Promise.reject(error);
    }
  );

  apiInstance.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
      return response;
    },
    async (error: AxiosError): Promise<any> => {
      console.log(`[API Response Error] ${error.response?.status} ${error.config?.url}`);
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Only refresh token when we get a 401/403 error (token is invalid/expired)
      if (error.response?.status && [401, 403].includes(error.response.status) &&
          !originalRequest._retry &&
          originalRequest.url && !isRefreshTokenEndpoint(originalRequest.url)) {
        
        console.log(`[Token Refresh] Attempting token refresh for ${originalRequest.url}`);
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          console.log(`[Token Refresh] RefreshToken exists: ${refreshToken ? 'YES' : 'NO'}`);
          
          if (!refreshToken) {
            console.log(`[Token Refresh] No refresh token available, redirecting to login`);
            throw new Error('No refresh token available');
          }

          console.log(`[Token Refresh] Making refresh request to /api/auth/refresh`);
          const response = await localApi.post(`/api/auth/refresh`, {
            refreshToken,
          });

          console.log(`[Token Refresh] Refresh response status: ${response.status}`);
          console.log(`[Token Refresh] Refresh response data:`, response.data);

          if (response.data.data) {
            const newAccessToken = response.data.data.accessToken;
            const newRefreshToken = response.data.data.refreshToken;

            console.log(`[Token Refresh] New tokens received - AccessToken: ${newAccessToken ? 'EXISTS' : 'NULL'}, RefreshToken: ${newRefreshToken ? 'EXISTS' : 'NULL'}`);

            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            accessToken = newAccessToken;

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            console.log(`[Token Refresh] Retrying original request to ${originalRequest.url}`);
          } else {
            console.error(`[Token Refresh] Invalid response from refresh token endpoint:`, response.data);
            throw new Error('Invalid response from refresh token endpoint');
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return getApiInstance(originalRequest.url || '')(originalRequest);
        } catch (err) {
          console.error(`[Token Refresh] Refresh failed:`, err);
          console.log(`[Token Refresh] Clearing tokens and redirecting to login`);
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('accessToken');
          accessToken = null;
          window.location.href = '/login';
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(localApi);



const api = {
  request: (config: AxiosRequestConfig) => {
    const apiInstance = getApiInstance(config.url || '');
    return apiInstance(config);
  },
  get: (url: string, config?: AxiosRequestConfig) => {
    const apiInstance = getApiInstance(url);
    return apiInstance.get(url, config);
  },
  post: (url: string, data?: any, config?: AxiosRequestConfig) => {
    const apiInstance = getApiInstance(url);
    return apiInstance.post(url, data, config);
  },
  put: (url: string, data?: any, config?: AxiosRequestConfig) => {
    const apiInstance = getApiInstance(url);
    return apiInstance.put(url, data, config);
  },
  delete: (url: string, config?: AxiosRequestConfig) => {
    const apiInstance = getApiInstance(url);
    return apiInstance.delete(url, config);
  },
};

export default api;