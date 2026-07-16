import { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as tokenStorage from "../auth/tokenStorage";

export const setupInterceptors = (axiosInstance: AxiosInstance): AxiosInstance => {
  // Request Interceptor: Attach bearer authorization tokens if present
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Central error mapping handler
  axiosInstance.interceptors.response.use(
    (response) => {
      // Unpack success_response from backend envelope
      if (response.data && typeof response.data === "object" && "success" in response.data) {
        const resData = response.data;
        if (resData.success) {
          if (
            resData.data &&
            typeof resData.data === "object" &&
            "items" in resData.data &&
            Array.isArray(resData.data.items)
          ) {
            const mappedItems = resData.data.items.map((item: any) => {
              if (item && typeof item === "object" && "id" in item && !("_id" in item)) {
                (item as Record<string, unknown>)._id = item.id;
              }
              return item;
            });
            (mappedItems as any).total = resData.data.total;
            (mappedItems as any).page = resData.data.page;
            (mappedItems as any).per_page = resData.data.per_page;
            (mappedItems as any).total_pages = resData.data.total_pages;
            response.data = mappedItems;
          } else {
            response.data = resData.data;
          }
        }
      }
      return response;
    },
    async (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          tokenStorage.clearTokens();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};
