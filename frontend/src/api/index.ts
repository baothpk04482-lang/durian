import apiClient from "./axios";
import { setupInterceptors } from "./interceptors";

const api = setupInterceptors(apiClient);

export default api;
