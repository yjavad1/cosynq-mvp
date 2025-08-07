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
  organizationId: string;
  locationId?: string;
  productTypeId?: string;
  name: string;
  description: string;
  type: 'Hot Desk' | 'Meeting Room' | 'Private Office';
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Out of Service' | 'Reserved' | 'Cleaning';
  capacity: number;
  area?: number;
  floor?: string;
  room?: string;
  spaceCode?: string;
  position?: {
    coordinates?: {
      x: number;
      y: number;
    };
    zone?: string;
    section?: string;
  };
  rates: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency: string;
  };
  amenities: string[];
  equipment: string[];
  workingHours: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  isActive: boolean;
  minimumBookingDuration: number;
  maximumBookingDuration: number;
  advanceBookingLimit: number;
  allowSameDayBooking: boolean;
  images?: string[];
  stats?: {
    totalBookings?: number;
    totalBookingHours?: number;
    averageBookingDuration?: number;
    occupancyRate?: number;
    revenue?: number;
    lastBookingDate?: Date;
    maintenanceScheduled?: Date;
    customerRating?: number;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  workingHours: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  amenities: string[];
  capacity: {
    totalSpaces: number;
    totalDesks: number;
    meetingRooms: number;
    privateOffices: number;
  };
  isActive: boolean;
  images?: string[];
  stats?: {
    totalSpaces?: number;
    occupancyRate?: number;
    totalRevenue?: number;
    averageRating?: number;
    totalBookings?: number;
  };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  type: 'lead' | 'prospect' | 'member' | 'inactive' | 'churned';
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  tags: string[];
  status: 'active' | 'inactive';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  contextState: 'new' | 'qualified' | 'interested' | 'negotiating' | 'converted' | 'lost' | 'nurturing';
  profileData?: {
    industry?: string;
    companySize?: string;
    budget?: number;
    requirements?: string[];
    timeline?: string;
    decisionMakers?: string[];
    painPoints?: string[];
  };
  metadata?: {
    totalInteractions?: number;
    lastInteractionDate?: Date;
    firstContactDate?: Date;
    conversionDate?: Date;
    source?: string;
    referredBy?: string;
    lifetimeValue?: number;
    membershipHistory?: Array<{
      startDate: Date;
      endDate?: Date;
      membershipType: string;
      monthlyFee: number;
    }>;
  };
  interactions: Array<{
    id?: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'tour' | 'ai_conversation';
    subject?: string;
    content: string;
    timestamp: Date;
    metadata?: {
      aiModel?: string;
      aiContext?: string;
      duration?: number;
      outcome?: string;
      nextActions?: string[];
    };
  }>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContextState = 'new' | 'qualified' | 'interested' | 'negotiating' | 'converted' | 'lost' | 'nurturing';

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ContactsResponse {
  contacts: Contact[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  contactsByType: {
    leads: number;
    prospects: number;
    members: number;
    inactive: number;
    churned: number;
  };
  contactsByContext: {
    new: number;
    qualified: number;
    interested: number;
    negotiating: number;
    converted: number;
    lost: number;
    nurturing: number;
  };
  contactsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  recentActivity: {
    newContactsThisWeek: number;
    newContactsThisMonth: number;
    conversionsThisWeek: number;
    conversionsThisMonth: number;
  };
}

export interface CreateContactData {
  type: Contact['type'];
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  tags: string[];
  priority: Contact['priority'];
  assignedTo?: string;
  contextState: ContextState;
  profileData?: Contact['profileData'];
}

export interface SpacesResponse {
  spaces: Space[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SpaceStats {
  totalSpaces: number;
  activeSpaces: number;
  spacesByType: {
    'Hot Desk': number;
    'Meeting Room': number;
    'Private Office': number;
  };
  spacesByStatus: {
    Available: number;
    Occupied: number;
    Maintenance: number;
    'Out of Service': number;
    Reserved: number;
    Cleaning: number;
  };
  totalCapacity: number;
  averageOccupancyRate?: number;
  totalRevenue?: number;
}

export interface CreateSpaceData {
  locationId?: string;
  productTypeId?: string;
  name: string;
  description?: string;
  type: Space['type'];
  capacity: number;
  area?: number;
  floor?: string;
  room?: string;
  spaceCode?: string;
  position?: Space['position'];
  rates: Space['rates'];
  amenities: string[];
  equipment: string[];
  workingHours: Space['workingHours'];
  minimumBookingDuration?: number;
  maximumBookingDuration?: number;
  advanceBookingLimit?: number;
  allowSameDayBooking?: boolean;
  images?: string[];
}

export interface SpaceAvailability {
  spaceId: string;
  spaceName: string;
  date: string;
  isAvailable: boolean;
  availableSlots: Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  bookings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    clientName?: string;
  }>;
}

export interface LocationsResponse {
  locations: Location[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LocationStats {
  totalLocations: number;
  activeLocations: number;
  totalCapacity: number;
  totalSpaces: number;
  averageOccupancy?: number;
  topPerformingLocation?: {
    id: string;
    name: string;
    occupancyRate: number;
  };
}

export interface CreateLocationData {
  name: string;
  description?: string;
  address: Location['address'];
  contact: Location['contact'];
  workingHours: Location['workingHours'];
  amenities: string[];
  capacity: Location['capacity'];
  images?: string[];
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