import axios, { AxiosInstance, AxiosResponse } from 'axios';

// TypeScript Interfaces for Booking Data
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'No Show';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed';

export interface BookingData {
  _id: string;
  organizationId: string;
  spaceId: string;
  contactId?: string;
  
  // Booking Details
  startTime: string;
  endTime: string;
  status: BookingStatus;
  
  // Customer Information (for non-contact bookings)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Booking Configuration
  purpose?: string;
  attendeeCount: number;
  specialRequests?: string;
  
  // Pricing
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  
  // Check-in/Check-out
  checkedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  
  // Metadata
  bookingReference: string;
  notes?: string;
  cancelReason?: string;
  
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated references
  space?: {
    _id: string;
    name: string;
    locationId: string;
    capacity: number;
  };
  contact?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateBookingData {
  spaceId: string;
  contactId?: string;
  
  // Time Details
  startTime: string;
  endTime: string;
  
  // Customer Information (required if no contactId)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Booking Details
  purpose?: string;
  attendeeCount: number;
  specialRequests?: string;
  
  // Pricing
  totalAmount: number;
  currency?: string;
  
  // Notes
  notes?: string;
}

export interface UpdateBookingData {
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  
  // Customer Information updates
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Booking Details updates
  purpose?: string;
  attendeeCount?: number;
  specialRequests?: string;
  
  // Status updates
  paymentStatus?: PaymentStatus;
  cancelReason?: string;
  notes?: string;
  
  // Check-in/Check-out
  checkedIn?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  thisWeekBookings: number;
  bookingsByStatus: Array<{
    status: BookingStatus;
    count: number;
  }>;
  bookingsBySpace: Array<{
    spaceId: string;
    spaceName: string;
    count: number;
  }>;
  recentBookings: BookingData[];
}

export interface BookingsResponse {
  bookings: BookingData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface AvailabilityResponse {
  spaceId: string;
  date: string;
  duration: number;
  isAvailable: boolean;
  availableSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
  conflictingBookings: Array<{
    bookingId: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

import { getApiBaseUrl } from '../utils/apiConfig';

const API_BASE_URL = getApiBaseUrl();

class BookingApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add authentication token
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

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle onboarding required responses
        if (error.response?.status === 403 && error.response?.data?.code === 'ONBOARDING_REQUIRED') {
          const onboardingData = error.response.data.data;
          localStorage.setItem('cosynq_onboarding_required', 'true');
          if (onboardingData) {
            localStorage.setItem('cosynq_onboarding_data', JSON.stringify(onboardingData));
          }
          
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/onboarding') && !currentPath.includes('/setup')) {
            window.location.href = '/onboarding';
            return Promise.reject(error);
          }
        }
        
        // Handle authentication errors
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

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<{ token: string }>>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  // Booking CRUD Operations
  async getBookings(params?: {
    page?: number;
    limit?: number;
    search?: string;
    spaceId?: string;
    contactId?: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
    startDate?: string;
    endDate?: string;
    checkedIn?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AxiosResponse<ApiResponse<BookingsResponse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.api.get(`/bookings${queryString ? `?${queryString}` : ''}`);
  }

  async getBooking(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.api.get(`/bookings/${id}`);
  }

  async createBooking(bookingData: CreateBookingData): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    return this.api.post('/bookings', bookingData);
  }

  async updateBooking(id: string, bookingData: UpdateBookingData): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    console.log('Updating booking:', id, 'with data:', JSON.stringify(bookingData, null, 2));
    return this.api.put(`/bookings/${id}`, bookingData);
  }

  async deleteBooking(id: string, cancelReason?: string): Promise<AxiosResponse<ApiResponse<{}>>> {
    const data = cancelReason ? { cancelReason } : {};
    return this.api.delete(`/bookings/${id}`, { data });
  }

  async getBookingStats(): Promise<AxiosResponse<ApiResponse<BookingStats>>> {
    return this.api.get('/bookings/stats');
  }

  // Space Availability Operations
  async checkAvailability(spaceId: string, params: {
    date: string;
    duration?: number;
  }): Promise<AxiosResponse<ApiResponse<AvailabilityResponse>>> {
    const queryParams = new URLSearchParams();
    queryParams.append('date', params.date);
    if (params.duration) {
      queryParams.append('duration', params.duration.toString());
    }
    
    return this.api.get(`/spaces/${spaceId}/availability?${queryParams.toString()}`);
  }

  // Booking Status Management
  async confirmBooking(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { status: 'Confirmed' });
  }

  async cancelBooking(id: string, cancelReason: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { 
      status: 'Cancelled',
      cancelReason 
    });
  }

  async checkInBooking(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { 
      checkedIn: true,
      checkInTime: new Date().toISOString()
    });
  }

  async checkOutBooking(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { 
      checkOutTime: new Date().toISOString()
    });
  }

  async markNoShow(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { status: 'No Show' });
  }

  async completeBooking(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { status: 'Completed' });
  }

  // Payment Management
  async markPaymentPaid(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { paymentStatus: 'Paid' });
  }

  async markPaymentFailed(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { paymentStatus: 'Failed' });
  }

  async refundPayment(id: string): Promise<AxiosResponse<ApiResponse<{ booking: BookingData }>>> {
    return this.updateBooking(id, { paymentStatus: 'Refunded' });
  }
}

export const bookingApiService = new BookingApiService();
export default bookingApiService;