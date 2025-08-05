export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'guest';
  isEmailVerified: boolean;
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
  };
  errors?: string[];
}

export interface LegacySpace {
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

export type ContactType = 'Lead' | 'Member' | 'Prospect';
export type ContextState = 'New' | 'Touring' | 'Negotiating' | 'Active' | 'Inactive' | 'Churned';

export interface ContactInteraction {
  _id: string;
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
  createdBy: User;
  createdAt: Date;
}

export interface Contact {
  _id: string;
  organizationId: string;
  type: ContactType;
  contextState: ContextState;
  
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  tags: string[];
  
  aiContext: {
    preferences: string[];
    interests: string[];
    painPoints: string[];
    budget?: {
      min?: number;
      max?: number;
      currency: string;
    };
    spaceRequirements: string[];
    lastContextUpdate: Date;
  };
  
  interactions: ContactInteraction[];
  
  leadSource?: string;
  assignedTo?: User;
  
  membership?: {
    planType?: string;
    startDate?: Date;
    endDate?: Date;
    monthlyRate?: number;
  };
  
  priority: 'low' | 'medium' | 'high';
  
  createdBy: User;
  updatedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactData {
  type: ContactType;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  leadSource?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  aiContext?: {
    preferences?: string[];
    interests?: string[];
    painPoints?: string[];
    budget?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    spaceRequirements?: string[];
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalContacts: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ContactStats {
  totalContacts: number;
  contactsByType: Array<{ _id: ContactType; count: number }>;
  contactsByState: Array<{ _id: ContextState; count: number }>;
  contactsByPriority: Array<{ _id: string; count: number }>;
  recentInteractions: ContactInteraction[];
}

// Space Management Types
export type SpaceType = 'Hot Desk' | 'Meeting Room' | 'Private Office';
export type SpaceStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Out of Service';

export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface SpaceRates {
  hourly?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
  currency: string;
}

export interface Space {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: SpaceType;
  status: SpaceStatus;
  capacity: number;
  area?: number;
  floor?: string;
  room?: string;
  rates: SpaceRates;
  amenities: string[];
  equipment: string[];
  workingHours: WorkingHours[];
  isActive: boolean;
  minimumBookingDuration: number;
  maximumBookingDuration: number;
  advanceBookingLimit: number;
  allowSameDayBooking: boolean;
  images?: string[];
  createdBy: User;
  updatedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpaceData {
  name: string;
  description?: string;
  type: SpaceType;
  status?: SpaceStatus;
  capacity: number;
  area?: number;
  floor?: string;
  room?: string;
  rates: SpaceRates;
  amenities?: string[];
  equipment?: string[];
  workingHours: WorkingHours[];
  isActive?: boolean;
  minimumBookingDuration?: number;
  maximumBookingDuration?: number;
  advanceBookingLimit?: number;
  allowSameDayBooking?: boolean;
  images?: string[];
}

export interface SpacesResponse {
  spaces: Space[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalSpaces: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SpaceStats {
  totalSpaces: number;
  spacesByType: Array<{ _id: SpaceType; count: number }>;
  spacesByStatus: Array<{ _id: SpaceStatus; count: number }>;
  totalCapacity: number;
  averageRates: {
    avgHourly: number;
    avgDaily: number;
  };
}

export interface SpaceAvailability {
  space: {
    _id: string;
    name: string;
    type: SpaceType;
    capacity: number;
    status: SpaceStatus;
    rates: SpaceRates;
  };
  availability: Array<{
    date: string;
    dayOfWeek: string;
    isAvailable: boolean;
    workingHours: {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    } | null;
    status: SpaceStatus;
  }>;
}