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

export interface OnboardingData {
  companyName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  description?: string;
  hasCreatedLocation?: boolean;
  hasCreatedSpace?: boolean;
  hasConfiguredPricing?: boolean;
  completionSteps?: string[];
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

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
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

// Missing type exports for components
export type SpaceType = 'Hot Desk' | 'Meeting Room' | 'Private Office';
export type SpaceStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Out of Service' | 'Reserved' | 'Cleaning';
export type ContactType = 'Lead' | 'Member' | 'Prospect';
export type ContextState = 'New' | 'Touring' | 'Negotiating' | 'Active' | 'Inactive' | 'Churned';

export interface WorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

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

// Setup Wizard Types
export type SetupStep = 'company' | 'locations' | 'launch';

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

// Location Management Types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface OperatingHours {
  day: DayOfWeek;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
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

// Updated Location interface with proper structure
export interface Location {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  code: string;
  address: LocationAddress;
  contacts: LocationContact[];
  operatingHours: OperatingHours[];
  timezone: string;
  amenities: AmenityType[];
  totalFloors?: number;
  totalCapacity?: number;
  isActive: boolean;
  allowSameDayBooking: boolean;
  defaultBookingRules?: {
    minimumBookingDuration: number;
    maximumBookingDuration: number;
    advanceBookingLimit: number;
    cancellationPolicy?: string;
  };
  images?: string[];
  virtualTourUrl?: string;
  managerId?: User;
  staff?: User[];
  stats?: {
    totalSpaces?: number;
    totalBookingsToday?: number;
    currentOccupancy?: number;
    lastMaintenanceDate?: Date;
  };
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

// Update LocationsResponse to include pagination
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

// Update Space interface with proper _id and structure
export interface Space {
  _id: string;
  organizationId: string;
  locationId?: string;
  name: string;
  description?: string;
  type: SpaceType;
  status: SpaceStatus;
  capacity: number;
  area?: number;
  floor?: string;
  room?: string;
  rates: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency: string;
  };
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
  rates: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency: string;
  };
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

// Update SpacesResponse to include pagination
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

// ProductType interfaces
export type ProductTypeCategory = 
  | 'Private_Office'
  | 'Manager_Cabin' 
  | 'Team_Cabin'
  | 'Meeting_Room'
  | 'Phone_Booth'
  | 'Hot_Desk'
  | 'Dedicated_Desk'
  | 'Conference_Room'
  | 'Event_Space'
  | 'Training_Room'
  | 'Interview_Room'
  | 'Focus_Pod'
  | 'Lounge_Area'
  | 'Virtual_Office';

export type PricingType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'tiered' | 'membership';

export interface PricingTier {
  name: string;
  duration?: number; // in minutes
  price: number;
  currency: string;
  description?: string;
  conditions?: string;
}

export interface ProductTypePricingRule {
  type: PricingType;
  basePrice?: number;
  currency: string;
  tiers?: PricingTier[];
  minimumDuration?: number;
  maximumDuration?: number;
  advanceBookingRequired?: number;
}

export interface CapacityConfig {
  minCapacity: number;
  maxCapacity: number;
  optimalCapacity: number;
  standingCapacity?: number;
  wheelchairAccessible?: boolean;
}

export interface AutoGenerationConfig {
  enabled: boolean;
  naming: {
    prefix: string;
    startNumber: number;
    digits: number;
  };
  distribution?: {
    byFloor?: boolean;
    perFloor?: number;
    preferredFloors?: number[];
  };
}

export interface ProductTypeAmenities {
  included?: string[];
  optional?: Array<{
    name: string;
    price: number;
    currency: string;
    description?: string;
  }>;
  required?: string[];
}

export interface ProductType {
  _id: string;
  locationId: string;
  organizationId: string;
  name: string;
  category: ProductTypeCategory;
  code: string;
  description?: string;
  capacity: CapacityConfig;
  pricing: ProductTypePricingRule;
  amenities?: ProductTypeAmenities;
  features?: string[];
  isActive: boolean;
  autoGeneration: AutoGenerationConfig;
  accessLevel?: 'public' | 'members_only' | 'premium_members' | 'private' | 'by_invitation';
  displayOrder?: number;
  isHighlight?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTypeData {
  locationId: string;
  name: string;
  category: ProductTypeCategory;
  code: string;
  description?: string;
  capacity: CapacityConfig;
  pricing: ProductTypePricingRule;
  amenities?: ProductTypeAmenities;
  features?: string[];
  isActive?: boolean;
  autoGeneration: AutoGenerationConfig;
  accessLevel?: 'public' | 'members_only' | 'premium_members' | 'private' | 'by_invitation';
  displayOrder?: number;
  isHighlight?: boolean;
}

export interface ProductTypesResponse {
  productTypes: ProductType[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Contact interfaces
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