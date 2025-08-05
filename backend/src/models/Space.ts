import mongoose, { Document, Schema, Types } from 'mongoose';

export type SpaceType = 'Hot Desk' | 'Meeting Room' | 'Private Office';
export type SpaceStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Out of Service';

export interface IWorkingHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string; // Format: "HH:MM" (24-hour)
  closeTime?: string; // Format: "HH:MM" (24-hour)
}

export interface ISpaceRates {
  hourly?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
  currency: string;
}

export interface ISpace extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  
  // Basic Information
  name: string;
  description?: string;
  type: SpaceType;
  status: SpaceStatus;
  
  // Capacity and Physical Properties
  capacity: number;
  area?: number; // in square feet/meters
  floor?: string;
  room?: string;
  
  // Pricing
  rates: ISpaceRates;
  
  // Amenities and Features
  amenities: string[];
  equipment: string[];
  
  // Availability and Hours
  workingHours: IWorkingHours[];
  isActive: boolean;
  
  // Booking Configuration
  minimumBookingDuration: number; // in minutes
  maximumBookingDuration: number; // in minutes
  advanceBookingLimit: number; // in days
  allowSameDayBooking: boolean;
  
  // Images and Media
  images?: string[];
  
  // Metadata
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  isAvailableAt(dateTime: Date): boolean;
  getWorkingHoursForDay(day: string): IWorkingHours | null;
  getRateForDuration(durationMinutes: number): { rate: number; type: string };
}

const workingHoursSchema = new Schema<IWorkingHours>({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true,
    default: true
  },
  openTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    default: '09:00'
  },
  closeTime: {
    type: String,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    default: '17:00'
  }
}, { _id: false });

const spaceRatesSchema = new Schema<ISpaceRates>({
  hourly: {
    type: Number,
    min: 0
  },
  daily: {
    type: Number,
    min: 0
  },
  weekly: {
    type: Number,
    min: 0
  },
  monthly: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    length: 3
  }
}, { _id: false });

const spaceSchema = new Schema<ISpace>({
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
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['Hot Desk', 'Meeting Room', 'Private Office'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance', 'Out of Service'],
    default: 'Available',
    index: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  area: {
    type: Number,
    min: 0
  },
  floor: {
    type: String,
    trim: true,
    maxlength: 10
  },
  room: {
    type: String,
    trim: true,
    maxlength: 20
  },
  rates: {
    type: spaceRatesSchema,
    required: true
  },
  amenities: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  equipment: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  workingHours: {
    type: [workingHoursSchema],
    required: true,
    validate: {
      validator: function(hours: IWorkingHours[]) {
        const days = hours.map(h => h.day);
        return days.length === new Set(days).size; // Ensure unique days
      },
      message: 'Each day can only appear once in working hours'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  minimumBookingDuration: {
    type: Number,
    default: 60, // 1 hour in minutes
    min: 15,
    max: 1440 // 24 hours
  },
  maximumBookingDuration: {
    type: Number,
    default: 480, // 8 hours in minutes
    min: 15,
    max: 1440 // 24 hours
  },
  advanceBookingLimit: {
    type: Number,
    default: 30, // 30 days
    min: 0,
    max: 365
  },
  allowSameDayBooking: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    trim: true
  }],
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

// Instance methods
spaceSchema.methods.isAvailableAt = function(dateTime: Date): boolean {
  if (!this.isActive || this.status !== 'Available') {
    return false;
  }
  
  const dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const workingHours = this.getWorkingHoursForDay(dayName);
  
  if (!workingHours || !workingHours.isOpen) {
    return false;
  }
  
  const timeString = dateTime.toTimeString().substring(0, 5);
  return timeString >= workingHours.openTime && timeString <= workingHours.closeTime;
};

spaceSchema.methods.getWorkingHoursForDay = function(day: string): IWorkingHours | null {
  const dayLower = day.toLowerCase();
  return this.workingHours.find((wh: IWorkingHours) => wh.day === dayLower) || null;
};

spaceSchema.methods.getRateForDuration = function(durationMinutes: number): { rate: number; type: string } {
  const durationHours = durationMinutes / 60;
  const durationDays = durationMinutes / (60 * 24);
  
  // Prioritize the most cost-effective rate for the customer
  if (this.rates.monthly && durationDays >= 30) {
    return { rate: this.rates.monthly, type: 'monthly' };
  }
  
  if (this.rates.weekly && durationDays >= 7) {
    return { rate: this.rates.weekly, type: 'weekly' };
  }
  
  if (this.rates.daily && durationHours >= 8) {
    return { rate: this.rates.daily, type: 'daily' };
  }
  
  if (this.rates.hourly) {
    return { rate: this.rates.hourly * Math.ceil(durationHours), type: 'hourly' };
  }
  
  // Fallback to daily rate if available
  if (this.rates.daily) {
    return { rate: this.rates.daily, type: 'daily' };
  }
  
  return { rate: 0, type: 'free' };
};

// Indexes for performance
spaceSchema.index({ organizationId: 1, type: 1 });
spaceSchema.index({ organizationId: 1, status: 1 });
spaceSchema.index({ organizationId: 1, isActive: 1 });
spaceSchema.index({ organizationId: 1, capacity: 1 });
spaceSchema.index({ organizationId: 1, 'rates.hourly': 1 });
spaceSchema.index({ organizationId: 1, 'rates.daily': 1 });
spaceSchema.index({ organizationId: 1, amenities: 1 });
spaceSchema.index({ createdAt: -1 });
spaceSchema.index({ updatedAt: -1 });

// Ensure unique space names within an organization
spaceSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const Space = mongoose.model<ISpace>('Space', spaceSchema);