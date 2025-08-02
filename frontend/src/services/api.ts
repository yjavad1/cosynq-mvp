import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('cosynq_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('cosynq_refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              if (response.data.data) {
                const { token } = response.data.data;
                
                localStorage.setItem('cosynq_token', token);
                originalRequest.headers.Authorization = `Bearer ${token}`;
                
                return this.api(originalRequest);
              }
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private clearTokens(): void {
    localStorage.removeItem('cosynq_token');
    localStorage.removeItem('cosynq_refresh_token');
  }

  async register(credentials: RegisterCredentials): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/register', credentials);
  }

  async login(credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/login', credentials);
  }

  async logout(): Promise<AxiosResponse> {
    const response = await this.api.post('/auth/logout');
    this.clearTokens();
    return response;
  }

  async getProfile(): Promise<AxiosResponse<{ success: boolean; data: { user: User } }>> {
    return this.api.get('/auth/profile');
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async checkHealth(): Promise<AxiosResponse> {
    return this.api.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;