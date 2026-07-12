import api from "../api";
import type { AxiosRequestConfig } from "axios";

export class BaseService<T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async get<R = T[]>(config?: AxiosRequestConfig): Promise<R> {
    const response = await api.get<R>(this.endpoint, config);
    return response.data;
  }

  async getById<R = T>(id: string, config?: AxiosRequestConfig): Promise<R> {
    const response = await api.get<R>(`${this.endpoint}/${id}`, config);
    return response.data;
  }

  async post<R = T>(data: Partial<T>, config?: AxiosRequestConfig): Promise<R> {
    const response = await api.post<R>(this.endpoint, data, config);
    return response.data;
  }

  async put<R = T>(id: string, data: Partial<T>, config?: AxiosRequestConfig): Promise<R> {
    const response = await api.put<R>(`${this.endpoint}/${id}`, data, config);
    return response.data;
  }

  async delete<R = void>(id: string, config?: AxiosRequestConfig): Promise<R> {
    const response = await api.delete<R>(`${this.endpoint}/${id}`, config);
    return response.data;
  }
}
