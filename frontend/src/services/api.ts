import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  User,
  Contact,
  CreateContactData,
  ContactsResponse,
  ContactStats,
  ContextState,
  ApiResponse,
  Space,
  CreateSpaceData,
  SpacesResponse,
  SpaceStats,
  SpaceAvailability,
  Location,
  CreateLocationData,
  LocationsResponse,
  LocationStats
} from '@shared/types';

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

  // Contact Management Methods
  async getContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    contextState?: string;
    assignedTo?: string;
    priority?: string;
    tags?: string;
  }): Promise<AxiosResponse<ApiResponse<ContactsResponse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.api.get(`/contacts${queryString ? `?${queryString}` : ''}`);
  }

  async getContact(id: string): Promise<AxiosResponse<ApiResponse<{ contact: Contact }>>> {
    return this.api.get(`/contacts/${id}`);
  }

  async createContact(contactData: CreateContactData): Promise<AxiosResponse<ApiResponse<{ contact: Contact }>>> {
    console.log('Sending contact data to API:', JSON.stringify(contactData, null, 2));
    return this.api.post('/contacts', contactData);
  }

  async updateContact(id: string, contactData: Partial<CreateContactData>): Promise<AxiosResponse<ApiResponse<{ contact: Contact }>>> {
    console.log('=== API SERVICE UPDATE CONTACT ===');
    console.log('Contact ID:', id);
    console.log('Sending update data to API:', JSON.stringify(contactData, null, 2));
    
    try {
      const response = await this.api.put(`/contacts/${id}`, contactData);
      console.log('API response received:', response.status, response.statusText);
      return response;
    } catch (error: any) {
      console.error('API service update error:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  }

  async deleteContact(id: string): Promise<AxiosResponse<ApiResponse<{}>>> {
    return this.api.delete(`/contacts/${id}`);
  }

  async addInteraction(contactId: string, interaction: {
    type: 'call' | 'email' | 'meeting' | 'note' | 'tour' | 'ai_conversation';
    subject?: string;
    content: string;
    metadata?: {
      aiModel?: string;
      aiContext?: string;
      duration?: number;
      outcome?: string;
      nextActions?: string[];
    };
  }): Promise<AxiosResponse<ApiResponse<{ contact: Contact }>>> {
    return this.api.post(`/contacts/${contactId}/interactions`, interaction);
  }

  async updateContextState(contactId: string, data: {
    contextState: ContextState;
    reason?: string;
  }): Promise<AxiosResponse<ApiResponse<{ contact: Contact }>>> {
    return this.api.patch(`/contacts/${contactId}/context-state`, data);
  }

  async getContactStats(): Promise<AxiosResponse<ApiResponse<ContactStats>>> {
    return this.api.get('/contacts/stats');
  }

  // Space Management Methods
  async getSpaces(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    isActive?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    amenities?: string;
  }): Promise<AxiosResponse<ApiResponse<SpacesResponse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.api.get(`/spaces${queryString ? `?${queryString}` : ''}`);
  }

  async getSpace(id: string): Promise<AxiosResponse<ApiResponse<{ space: Space }>>> {
    return this.api.get(`/spaces/${id}`);
  }

  async createSpace(spaceData: CreateSpaceData): Promise<AxiosResponse<ApiResponse<{ space: Space }>>> {
    console.log('Creating space with data:', JSON.stringify(spaceData, null, 2));
    return this.api.post('/spaces', spaceData);
  }

  async updateSpace(id: string, spaceData: Partial<CreateSpaceData>): Promise<AxiosResponse<ApiResponse<{ space: Space }>>> {
    console.log('Updating space:', id, 'with data:', JSON.stringify(spaceData, null, 2));
    return this.api.put(`/spaces/${id}`, spaceData);
  }

  async deleteSpace(id: string): Promise<AxiosResponse<ApiResponse<{}>>> {
    return this.api.delete(`/spaces/${id}`);
  }

  async getSpaceStats(): Promise<AxiosResponse<ApiResponse<SpaceStats>>> {
    return this.api.get('/spaces/stats');
  }

  async getSpaceAvailability(params: {
    spaceId?: string;
    startDate: string;
    endDate: string;
  }): Promise<AxiosResponse<ApiResponse<{ dateRange: { startDate: string; endDate: string }; availability: SpaceAvailability[] }>>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    return this.api.get(`/spaces/availability?${queryParams.toString()}`);
  }

  // Location Management Methods
  async getLocations(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    city?: string;
    state?: string;
    amenities?: string;
    minCapacity?: number;
    maxCapacity?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<AxiosResponse<ApiResponse<LocationsResponse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.api.get(`/locations${queryString ? `?${queryString}` : ''}`);
  }

  async getLocation(id: string): Promise<AxiosResponse<ApiResponse<{ location: Location }>>> {
    return this.api.get(`/locations/${id}`);
  }

  async createLocation(locationData: CreateLocationData): Promise<AxiosResponse<ApiResponse<{ location: Location }>>> {
    console.log('Creating location with data:', JSON.stringify(locationData, null, 2));
    return this.api.post('/locations', locationData);
  }

  async updateLocation(id: string, locationData: Partial<CreateLocationData>): Promise<AxiosResponse<ApiResponse<{ location: Location }>>> {
    console.log('Updating location:', id, 'with data:', JSON.stringify(locationData, null, 2));
    return this.api.put(`/locations/${id}`, locationData);
  }

  async deleteLocation(id: string): Promise<AxiosResponse<ApiResponse<{}>>> {
    return this.api.delete(`/locations/${id}`);
  }

  async getLocationStats(): Promise<AxiosResponse<ApiResponse<LocationStats>>> {
    return this.api.get('/locations/stats');
  }

  async checkLocationHours(id: string): Promise<AxiosResponse<ApiResponse<{
    isOpen: boolean;
    currentTime: string;
    currentDay: string;
    todayHours: any;
    timezone: string;
  }>>> {
    return this.api.get(`/locations/${id}/hours`);
  }
}

export const apiService = new ApiService();
export default apiService;