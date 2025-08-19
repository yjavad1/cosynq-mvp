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
  LocationStats,
  ProfileResponse,
  OperatingHours,
  OnboardingData,
  ProductType,
  CreateProductTypeData,
  ProductTypesResponse
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
        
        // Handle onboarding required responses
        if (error.response?.status === 403 && error.response?.data?.code === 'ONBOARDING_REQUIRED') {
          // Store onboarding info and redirect to onboarding
          const onboardingData = error.response.data.data;
          localStorage.setItem('cosynq_onboarding_required', 'true');
          if (onboardingData) {
            localStorage.setItem('cosynq_onboarding_data', JSON.stringify(onboardingData));
          }
          
          // Don't redirect if we're already on an onboarding-related path
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/onboarding') && !currentPath.includes('/setup')) {
            window.location.href = '/onboarding';
            return Promise.reject(error);
          }
        }
        
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

  async getProfile(): Promise<AxiosResponse<ProfileResponse>> {
    return this.api.get('/auth/profile');
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async requestPasswordReset(email: string): Promise<AxiosResponse<ApiResponse<{
    message: string;
    resetTokenSent: boolean;
  }>>> {
    return this.api.post('/auth/forgot-password', { email });
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AxiosResponse<ApiResponse<{
    message: string;
    passwordReset: boolean;
  }>>> {
    return this.api.post('/auth/reset-password', data);
  }

  async validateResetToken(token: string): Promise<AxiosResponse<ApiResponse<{
    valid: boolean;
    email?: string;
    expiresAt?: string;
  }>>> {
    return this.api.get(`/auth/validate-reset-token/${token}`);
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
    todayHours: OperatingHours | null;
    timezone: string;
  }>>> {
    return this.api.get(`/locations/${id}/hours`);
  }

  // Onboarding Management Methods
  async getOnboardingStatus(): Promise<AxiosResponse<ApiResponse<{
    onboardingCompleted: boolean;
    onboardingSkipped: boolean;
    onboardingCompletedAt?: string;
    onboardingData: OnboardingData | null;
    requiresOnboarding: boolean;
    completedSteps: string[];
  }>>> {
    return this.api.get('/onboarding/status');
  }

  async updateOnboardingData(data: {
    companyName?: string;
    industry?: string;
    companySize?: string;
    website?: string;
    description?: string;
    completionSteps?: string[];
    skipOnboarding?: boolean;
  }): Promise<AxiosResponse<ApiResponse<{
    user: User;
    requiresOnboarding: boolean;
  }>>> {
    console.log('Updating onboarding data:', JSON.stringify(data, null, 2));
    return this.api.put('/onboarding/data', data);
  }

  async completeOnboarding(skipOnboarding: boolean = false): Promise<AxiosResponse<ApiResponse<{
    onboardingCompleted: boolean;
    onboardingSkipped: boolean;
    requiresOnboarding: boolean;
  }>>> {
    return this.api.post('/onboarding/complete', { skipOnboarding });
  }

  async resetOnboarding(resetData: boolean = false): Promise<AxiosResponse<ApiResponse<{
    onboardingCompleted: boolean;
    onboardingSkipped: boolean;
    onboardingData: OnboardingData | null;
    requiresOnboarding: boolean;
  }>>> {
    return this.api.post('/onboarding/reset', { resetData });
  }

  // ProductType Management Methods
  async getProductTypes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    locationId?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<AxiosResponse<ApiResponse<ProductTypesResponse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.api.get(`/product-types${queryString ? `?${queryString}` : ''}`);
  }

  async getProductType(id: string): Promise<AxiosResponse<ApiResponse<{ productType: ProductType }>>> {
    return this.api.get(`/product-types/${id}`);
  }

  async createProductType(productTypeData: CreateProductTypeData): Promise<AxiosResponse<ApiResponse<{ productType: ProductType }>>> {
    console.log('Creating product type with data:', JSON.stringify(productTypeData, null, 2));
    return this.api.post('/product-types', productTypeData);
  }

  async updateProductType(id: string, productTypeData: Partial<CreateProductTypeData>): Promise<AxiosResponse<ApiResponse<{ productType: ProductType }>>> {
    console.log('Updating product type:', id, 'with data:', JSON.stringify(productTypeData, null, 2));
    return this.api.put(`/product-types/${id}`, productTypeData);
  }

  async deleteProductType(id: string): Promise<AxiosResponse<ApiResponse<{}>>> {
    return this.api.delete(`/product-types/${id}`);
  }

  async generateSpaces(productTypeId: string, count: number): Promise<AxiosResponse<ApiResponse<{ 
    productType: ProductType;
    spacesGenerated: number;
    spaces: Space[];
  }>>> {
    console.log('Generating spaces for product type:', productTypeId, 'count:', count);
    return this.api.post(`/product-types/${productTypeId}/generate-spaces`, { count });
  }

  // Analytics Management Methods
  async getAnalytics(params?: {
    timeRange?: string;
  }): Promise<AxiosResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    console.log('🔗 API Service: Fetching analytics from:', `${this.api.defaults.baseURL}/analytics${queryString ? `?${queryString}` : ''}`);
    return this.api.get(`/analytics${queryString ? `?${queryString}` : ''}`);
  }

  // WhatsApp Management Methods
  async getWhatsAppStatus(): Promise<AxiosResponse> {
    return this.api.get('/whatsapp/status');
  }

  async sendWhatsAppMessage(data: {
    toNumber: string;
    messageBody: string;
    contactId?: string;
  }): Promise<AxiosResponse> {
    return this.api.post('/whatsapp/send', data);
  }

  async getWhatsAppConversations(): Promise<AxiosResponse> {
    return this.api.get('/whatsapp/conversations');
  }

  async getWhatsAppConversation(phoneNumber: string): Promise<AxiosResponse> {
    return this.api.get(`/whatsapp/conversation/${phoneNumber}`);
  }
}

export const apiService = new ApiService();
export default apiService;