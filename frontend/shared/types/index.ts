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

// Location Management Types
export type AmenityType = 
  | 'WiFi' 
  | 'AC' 
  | 'Parking' 
  | 'Coffee' 
  | 'Security' 
  | 'Reception' 
  | 'Kitchen' 
  | 'Printer' 
  | 'Scanner' 
  | 'Whiteboard' 
  | 'Projector' 
  | 'Conference_Room' 
  | 'Phone_Booth' 
  | 'Lounge' 
  | 'Gym' 
  | 'Shower' 
  | 'Bike_Storage' 
  | 'Mail_Service' 
  | 'Cleaning_Service' 
  | 'Catering' 
  | 'Event_Space' 
  | 'Terrace' 
  | 'Garden' 
  | 'Handicap_Accessible';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface OperatingHours {
  day: DayOfWeek;
  isOpen: boolean;
  openTime?: string; // Format: "09:00" (24-hour format)
  closeTime?: string; // Format: "18:00" (24-hour format)
  isHoliday?: boolean;
  notes?: string;
}

export interface LocationContact {
  type: 'phone' | 'email' | 'whatsapp' | 'emergency';
  value: string;
  isPrimary?: boolean;
  label?: string;
}

export interface LocationAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
  floor?: string;
  unitNumber?: string;
}

export interface Location {
  _id: string;
  organizationId: string;
  
  name: string;
  description?: string;
  code: string; // Unique location code like "HQ", "BLR01"
  
  // Address and Contact Information
  address: LocationAddress;
  contacts: LocationContact[];
  
  // Operating Information
  operatingHours: OperatingHours[];
  timezone: string;
  
  // Amenities and Features
  amenities: AmenityType[];
  totalFloors?: number;
  totalCapacity?: number;
  
  // Operational Settings
  isActive: boolean;
  allowSameDayBooking: boolean;
  defaultBookingRules?: {
    minimumBookingDuration: number; // in minutes
    maximumBookingDuration: number; // in minutes
    advanceBookingLimit: number; // in days
    cancellationPolicy?: string;
  };
  
  // Metadata
  images?: string[];
  virtualTourUrl?: string;
  
  // Management
  managerId?: User;
  staff?: User[];
  
  // Analytics and Tracking
  stats?: {
    totalSpaces?: number;
    totalBookingsToday?: number;
    currentOccupancy?: number;
    lastMaintenanceDate?: Date;
  };
  
  // Audit fields
  createdBy: User;
  updatedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationData {
  name: string;
  description?: string;
  code: string;
  address: LocationAddress;
  contacts: LocationContact[];
  operatingHours: OperatingHours[];
  timezone?: string;
  amenities?: AmenityType[];
  totalFloors?: number;
  totalCapacity?: number;
  isActive?: boolean;
  allowSameDayBooking?: boolean;
  defaultBookingRules?: {
    minimumBookingDuration?: number;
    maximumBookingDuration?: number;
    advanceBookingLimit?: number;
    cancellationPolicy?: string;
  };
  images?: string[];
  virtualTourUrl?: string;
  managerId?: string;
  staff?: string[];
}

export interface LocationsResponse {
  locations: Location[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LocationStats {
  totalLocations: number;
  activeLocations: number;
  inactiveLocations: number;
  locationsByCity: Array<{ city: string; count: number }>;
  topAmenities: Array<{ amenity: AmenityType; count: number }>;
  recentLocations: Array<{
    _id: string;
    name: string;
    code: string;
    address: { city: string };
    createdAt: Date;
  }>;
}

// Setup Wizard Types
export type SetupStep = 'company' | 'locations' | 'spaces' | 'pricing' | 'launch';

export interface CompanyProfile {
  companyName: string;
  industry: string;
  companySize: string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface SpaceTypeConfig {
  id: string;
  name: string;
  description: string;
  category: 'hot-desk' | 'cabin' | 'meeting-room' | 'event-space';
  defaultCapacity: number;
  amenities: AmenityType[];
  defaultPricing: {
    hourly?: number;
    daily?: number;
    monthly?: number;
  };
  isActive: boolean;
}

export interface PricingRule {
  id: string;
  name: string;
  spaceTypeId: string;
  tiers: Array<{
    name: string;
    minHours: number;
    maxHours?: number;
    hourlyRate: number;
    discountPercent?: number;
  }>;
  isActive: boolean;
}

export interface SetupProgress {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  companyProfile?: CompanyProfile;
  locations: Location[];
  spaceTypes: SpaceTypeConfig[];
  pricingRules: PricingRule[];
  isCompleted: boolean;
  completionPercentage: number;
}

export interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  initialStep?: SetupStep;
}