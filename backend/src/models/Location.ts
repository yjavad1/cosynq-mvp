import mongoose, { Document, Schema, Types } from 'mongoose';

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

export interface IOperatingHours {
  day: DayOfWeek;
  isOpen: boolean;
  openTime?: string; // Format: "09:00" (24-hour format)
  closeTime?: string; // Format: "18:00" (24-hour format)
  isHoliday?: boolean; // For special holiday hours
  notes?: string; // e.g., "Limited services", "Half day"
}

export interface ILocationContact {
  type: 'phone' | 'email' | 'whatsapp' | 'emergency';
  value: string;
  isPrimary?: boolean;
  label?: string; // e.g., "Main Office", "Emergency"
}

export interface ILocationAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string; // e.g., "Near XYZ Mall", "Above ABC Bank"
  floor?: string; // e.g., "2nd Floor", "Ground Floor"
  unitNumber?: string; // e.g., "Unit 201", "Suite A"
}

export interface ILocation extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  
  name: string;
  description?: string;
  code: string; // Unique location code like "HQ", "BLR01", "MUM02"
  
  // Address and Contact Information
  address: ILocationAddress;
  contacts: ILocationContact[];
  
  // Operating Information
  operatingHours: IOperatingHours[];
  timezone: string; // e.g., "Asia/Kolkata", "America/New_York"
  
  // Amenities and Features
  amenities: AmenityType[];
  totalFloors?: number;
  totalCapacity?: number; // Maximum people capacity for the entire location
  
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
  images?: string[]; // URLs to location images
  virtualTourUrl?: string;
  
  // Management
  managerId?: Types.ObjectId; // Reference to User who manages this location
  staff?: Types.ObjectId[]; // Array of User references who work at this location
  
  // Analytics and Tracking
  stats?: {
    totalSpaces?: number;
    totalBookingsToday?: number;
    currentOccupancy?: number;
    lastMaintenanceDate?: Date;
  };
  
  // Audit fields
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isOpenNow(): boolean;
  getOperatingHoursForDay(day: DayOfWeek): IOperatingHours | null;
  hasAmenity(amenity: AmenityType): boolean;
  getDisplayAddress(): string;
  getPrimaryContact(type?: 'phone' | 'email'): ILocationContact | null;
}

// Operating Hours Schema
const operatingHoursSchema = new Schema<IOperatingHours>({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true,
    default: false
  },
  openTime: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Open time must be in HH:MM format'],
    validate: {
      validator: function(this: IOperatingHours, value: string) {
        // If isOpen is true, openTime is required
        return !this.isOpen || !!value;
      },
      message: 'Open time is required when location is open'
    }
  },
  closeTime: {
    type: String,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Close time must be in HH:MM format'],
    validate: {
      validator: function(this: IOperatingHours, value: string) {
        // If isOpen is true, closeTime is required
        return !this.isOpen || !!value;
      },
      message: 'Close time is required when location is open'
    }
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  }
});

// Contact Schema
const locationContactSchema = new Schema<ILocationContact>({
  type: {
    type: String,
    enum: ['phone', 'email', 'whatsapp', 'emergency'],
    required: true
  },
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    trim: true,
    maxlength: 50
  }
});

// Address Schema
const locationAddressSchema = new Schema<ILocationAddress>({
  street: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  state: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'India'
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: 200
  },
  floor: {
    type: String,
    trim: true,
    maxlength: 50
  },
  unitNumber: {
    type: String,
    trim: true,
    maxlength: 50
  }
});

// Main Location Schema
const locationSchema = new Schema<ILocation>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20,
    match: [/^[A-Z0-9_]+$/, 'Location code must contain only uppercase letters, numbers, and underscores']
  },
  address: {
    type: locationAddressSchema,
    required: true
  },
  contacts: [locationContactSchema],
  operatingHours: {
    type: [operatingHoursSchema],
    validate: {
      validator: function(hours: IOperatingHours[]) {
        // Ensure all 7 days are represented
        const days = hours.map(h => h.day);
        const uniqueDays = new Set(days);
        return uniqueDays.size === 7;
      },
      message: 'Operating hours must be specified for all 7 days of the week'
    }
  },
  timezone: {
    type: String,
    required: true,
    default: 'Asia/Kolkata'
  },
  amenities: [{
    type: String,
    enum: [
      'WiFi', 'AC', 'Parking', 'Coffee', 'Security', 'Reception', 
      'Kitchen', 'Printer', 'Scanner', 'Whiteboard', 'Projector', 
      'Conference_Room', 'Phone_Booth', 'Lounge', 'Gym', 'Shower', 
      'Bike_Storage', 'Mail_Service', 'Cleaning_Service', 'Catering', 
      'Event_Space', 'Terrace', 'Garden', 'Handicap_Accessible'
    ]
  }],
  totalFloors: {
    type: Number,
    min: 1,
    max: 200
  },
  totalCapacity: {
    type: Number,
    min: 1,
    max: 10000
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  allowSameDayBooking: {
    type: Boolean,
    default: true
  },
  defaultBookingRules: {
    minimumBookingDuration: {
      type: Number,
      default: 60, // 1 hour in minutes
      min: 15
    },
    maximumBookingDuration: {
      type: Number,
      default: 480, // 8 hours in minutes
      min: 15
    },
    advanceBookingLimit: {
      type: Number,
      default: 30, // 30 days
      min: 1
    },
    cancellationPolicy: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  images: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  virtualTourUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  staff: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    totalSpaces: {
      type: Number,
      default: 0,
      min: 0
    },
    totalBookingsToday: {
      type: Number,
      default: 0,
      min: 0
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0
    },
    lastMaintenanceDate: Date
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Instance Methods
locationSchema.methods.isOpenNow = function(): boolean {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as DayOfWeek;
  const todayHours = this.getOperatingHoursForDay(currentDay);
  
  if (!todayHours || !todayHours.isOpen) {
    return false;
  }
  
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
};

locationSchema.methods.getOperatingHoursForDay = function(day: DayOfWeek): IOperatingHours | null {
  return this.operatingHours.find((hours: IOperatingHours) => hours.day === day) || null;
};

locationSchema.methods.hasAmenity = function(amenity: AmenityType): boolean {
  return this.amenities.includes(amenity);
};

locationSchema.methods.getDisplayAddress = function(): string {
  const addr = this.address;
  let display = addr.street;
  
  if (addr.unitNumber) display = `${addr.unitNumber}, ${display}`;
  if (addr.floor) display = `${addr.floor}, ${display}`;
  if (addr.landmark) display = `${display}, ${addr.landmark}`;
  
  return `${display}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
};

locationSchema.methods.getPrimaryContact = function(type?: 'phone' | 'email'): ILocationContact | null {
  if (type) {
    return this.contacts.find((contact: ILocationContact) => 
      contact.type === type && contact.isPrimary
    ) || this.contacts.find((contact: ILocationContact) => contact.type === type) || null;
  }
  
  return this.contacts.find((contact: ILocationContact) => contact.isPrimary) || 
         this.contacts[0] || null;
};

// Indexes for multi-tenant support and performance
locationSchema.index({ organizationId: 1, code: 1 }, { unique: true }); // Unique code per organization
locationSchema.index({ organizationId: 1, isActive: 1 });
locationSchema.index({ organizationId: 1, name: 1 });
locationSchema.index({ organizationId: 1, managerId: 1 });
locationSchema.index({ organizationId: 1, 'address.city': 1 });
locationSchema.index({ organizationId: 1, 'address.state': 1 });
locationSchema.index({ amenities: 1 }); // For amenity-based queries
locationSchema.index({ createdAt: -1 }); // For sorting by creation date
locationSchema.index({ 'stats.currentOccupancy': 1 }); // For occupancy-based queries

// Pre-save middleware to ensure at least one primary contact
locationSchema.pre('save', function(next) {
  if (this.contacts && this.contacts.length > 0) {
    const hasPrimary = this.contacts.some(contact => contact.isPrimary);
    if (!hasPrimary) {
      this.contacts[0].isPrimary = true;
    }
  }
  next();
});

// Pre-save middleware to validate coordinates if provided
locationSchema.pre('save', function(next) {
  if (this.address.coordinates) {
    const { latitude, longitude } = this.address.coordinates;
    if (latitude && longitude) {
      if (latitude < -90 || latitude > 90) {
        return next(new Error('Latitude must be between -90 and 90'));
      }
      if (longitude < -180 || longitude > 180) {
        return next(new Error('Longitude must be between -180 and 180'));
      }
    }
  }
  next();
});

export const Location = mongoose.model<ILocation>('Location', locationSchema);