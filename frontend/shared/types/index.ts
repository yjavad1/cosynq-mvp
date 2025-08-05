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