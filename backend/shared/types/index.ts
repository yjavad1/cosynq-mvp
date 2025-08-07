export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'guest';
  isEmailVerified: boolean;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
  onboardingCompletedAt?: Date;
  onboardingData?: {
    companyName?: string;
    industry?: string;
    companySize?: string;
    website?: string;
    description?: string;
    hasCreatedLocation?: boolean;
    hasCreatedSpace?: boolean;
    hasConfiguredPricing?: boolean;
    completionSteps?: string[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface AuthUser extends User {
  token?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    requiresOnboarding?: boolean;
  };
  errors?: string[];
}

// Profile response type
export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
    requiresOnboarding?: boolean;
  };
}

export interface Space {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  amenities: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}