import mongoose, { Document, Schema, Types } from 'mongoose';

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

export type AccessLevel = 'public' | 'members_only' | 'premium_members' | 'private' | 'by_invitation';

export interface IPricingTier {
  name: string; // e.g., "First 90 minutes", "After 90 minutes", "Full day"
  duration?: number; // in minutes, null for unlimited/membership tiers
  price: number;
  currency: string;
  description?: string;
  conditions?: string; // e.g., "Minimum 2 hours", "Peak hours only"
}

export interface IPricingRule {
  type: PricingType;
  basePrice?: number; // For simple hourly/daily pricing
  currency: string;
  tiers?: IPricingTier[]; // For complex tiered pricing
  minimumDuration?: number; // in minutes
  maximumDuration?: number; // in minutes
  advanceBookingRequired?: number; // in hours
  cancellationPolicy?: {
    hoursBeforeStart: number;
    refundPercentage: number;
    description?: string;
  };
  memberDiscounts?: {
    membershipType: string;
    discountPercentage: number;
    description?: string;
  }[];
}

export interface ICapacityConfig {
  minCapacity: number;
  maxCapacity: number;
  optimalCapacity: number; // Recommended capacity for comfort
  standingCapacity?: number; // If different from seated
  wheelchairAccessible?: boolean;
}

export interface IProductTypeAmenities {
  included: string[]; // Amenities included in the base price
  optional: Array<{
    name: string;
    price: number;
    currency: string;
    description?: string;
  }>; // Additional amenities available for extra cost
  required: string[]; // Amenities that spaces of this type must have
}

export interface IAutoGenerationConfig {
  enabled: boolean;
  naming: {
    prefix: string; // e.g., "MC" for Manager Cabin, "TR" for Team Room
    startNumber: number; // e.g., 1 for MC001, MC002...
    digits: number; // Number of digits for padding (3 = 001, 002...)
  };
  distribution?: {
    byFloor?: boolean; // Distribute evenly across floors
    perFloor?: number; // Specific number per floor
    preferredFloors?: number[]; // Specific floor numbers
  };
}

export interface IProductType extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  locationId: Types.ObjectId; // Reference to Location

  // Basic Information
  name: string; // e.g., "Manager Cabin", "Team Cabin 4-pax", "Conference Room Large"
  description?: string;
  category: ProductTypeCategory;
  code: string; // Unique code like "MC", "TC4", "CRL"

  // Capacity and Physical Attributes
  capacity: ICapacityConfig;
  floorSpace?: number; // in square feet/meters
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'feet' | 'meters';
  };

  // Pricing Configuration
  pricing: IPricingRule;
  
  // Amenities and Features
  amenities: IProductTypeAmenities;
  features?: string[]; // Additional features like "Sound-proof", "Natural lighting", etc.

  // Booking and Operational Settings
  isActive: boolean;
  accessLevel: AccessLevel;
  operatingHours?: {
    useLocationDefault: boolean;
    customHours?: Array<{
      day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      startTime: string; // "09:00"
      endTime: string; // "18:00"
      isAvailable: boolean;
    }>;
  };

  // Auto-generation settings for individual spaces
  autoGeneration: IAutoGenerationConfig;
  
  // Marketing and Display
  images?: string[]; // URLs to product type images
  displayOrder?: number; // For sorting in UI
  isHighlight?: boolean; // Featured product type
  marketingDescription?: string; // Customer-facing description

  // Analytics and Tracking
  stats?: {
    totalSpacesGenerated?: number;
    averageOccupancyRate?: number;
    totalBookingsLast30Days?: number;
    averageBookingDuration?: number; // in minutes
    topBookingHours?: string[]; // ["09:00-10:00", "14:00-15:00"]
    customerRating?: number; // 1-5 stars
    totalRevenueLast30Days?: number;
  };

  // Metadata
  tags?: string[]; // For filtering and categorization
  isTemplate?: boolean; // Can this be used as a template for other locations
  
  // Audit fields
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculatePrice(duration: number, membershipType?: string): number;
  getAvailableAmenities(): string[];
  canAccommodate(requiredCapacity: number): boolean;
  isOperational(): boolean;
  generateSpaceName(sequenceNumber: number): string;
}

// Pricing Tier Schema
const pricingTierSchema = new Schema<IPricingTier>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  duration: {
    type: Number,
    min: 1,
    max: 10080 // Max 1 week in minutes
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: 3
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  conditions: {
    type: String,
    trim: true,
    maxlength: 300
  }
});

// Pricing Rule Schema
const pricingRuleSchema = new Schema<IPricingRule>({
  type: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'tiered', 'membership'],
    required: true
  },
  basePrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    maxlength: 3
  },
  tiers: [pricingTierSchema],
  minimumDuration: {
    type: Number,
    min: 15, // Minimum 15 minutes
    default: 60
  },
  maximumDuration: {
    type: Number,
    min: 15,
    max: 43200 // Max 30 days in minutes
  },
  advanceBookingRequired: {
    type: Number,
    min: 0,
    max: 8760, // Max 1 year in hours
    default: 0
  },
  cancellationPolicy: {
    hoursBeforeStart: {
      type: Number,
      min: 0,
      max: 168, // Max 1 week
      default: 2
    },
    refundPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300
    }
  },
  memberDiscounts: [{
    membershipType: {
      type: String,
      required: true,
      trim: true
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }]
});

// Capacity Configuration Schema
const capacityConfigSchema = new Schema<ICapacityConfig>({
  minCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  optimalCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  standingCapacity: {
    type: Number,
    min: 1,
    max: 2000
  },
  wheelchairAccessible: {
    type: Boolean,
    default: true
  }
});

// Auto Generation Configuration Schema
const autoGenerationConfigSchema = new Schema<IAutoGenerationConfig>({
  enabled: {
    type: Boolean,
    required: true,
    default: true
  },
  naming: {
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10
    },
    startNumber: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    digits: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3
    }
  },
  distribution: {
    byFloor: {
      type: Boolean,
      default: false
    },
    perFloor: {
      type: Number,
      min: 1,
      max: 100
    },
    preferredFloors: [{
      type: Number,
      min: 1,
      max: 200
    }]
  }
});

// Main ProductType Schema
const productTypeSchema = new Schema<IProductType>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  locationId: {
    type: Schema.Types.ObjectId,
    ref: 'Location',
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
  category: {
    type: String,
    enum: [
      'Private_Office', 'Manager_Cabin', 'Team_Cabin', 'Meeting_Room',
      'Phone_Booth', 'Hot_Desk', 'Dedicated_Desk', 'Conference_Room',
      'Event_Space', 'Training_Room', 'Interview_Room', 'Focus_Pod',
      'Lounge_Area', 'Virtual_Office'
    ],
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20,
    match: [/^[A-Z0-9_]+$/, 'Product type code must contain only uppercase letters, numbers, and underscores']
  },
  capacity: {
    type: capacityConfigSchema,
    required: true,
    validate: {
      validator: function(capacity: ICapacityConfig) {
        return capacity.minCapacity <= capacity.optimalCapacity && 
               capacity.optimalCapacity <= capacity.maxCapacity;
      },
      message: 'Capacity values must be in order: min ≤ optimal ≤ max'
    }
  },
  floorSpace: {
    type: Number,
    min: 1,
    max: 10000
  },
  dimensions: {
    length: {
      type: Number,
      min: 1,
      max: 1000
    },
    width: {
      type: Number,
      min: 1,
      max: 1000
    },
    height: {
      type: Number,
      min: 6, // Minimum ceiling height
      max: 50
    },
    unit: {
      type: String,
      enum: ['feet', 'meters'],
      default: 'feet'
    }
  },
  pricing: {
    type: pricingRuleSchema,
    required: true
  },
  amenities: {
    included: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    optional: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        required: true,
        default: 'USD'
      },
      description: {
        type: String,
        trim: true,
        maxlength: 200
      }
    }],
    required: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  },
  features: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  isActive: {
    type: Boolean,
    required: true,
    default: true,
    index: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'members_only', 'premium_members', 'private', 'by_invitation'],
    required: true,
    default: 'members_only'
  },
  operatingHours: {
    useLocationDefault: {
      type: Boolean,
      default: true
    },
    customHours: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
      },
      endTime: {
        type: String,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
      },
      isAvailable: Boolean
    }]
  },
  autoGeneration: {
    type: autoGenerationConfigSchema,
    required: true
  },
  images: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  displayOrder: {
    type: Number,
    min: 0,
    max: 1000,
    default: 0
  },
  isHighlight: {
    type: Boolean,
    default: false
  },
  marketingDescription: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  stats: {
    totalSpacesGenerated: {
      type: Number,
      default: 0,
      min: 0
    },
    averageOccupancyRate: {
      type: Number,
      min: 0,
      max: 100
    },
    totalBookingsLast30Days: {
      type: Number,
      default: 0,
      min: 0
    },
    averageBookingDuration: {
      type: Number,
      min: 0
    },
    topBookingHours: [{
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time range must be in HH:MM-HH:MM format']
    }],
    customerRating: {
      type: Number,
      min: 0,
      max: 5
    },
    totalRevenueLast30Days: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  isTemplate: {
    type: Boolean,
    default: false
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
productTypeSchema.methods.calculatePrice = function(duration: number, membershipType?: string): number {
  const pricing = this.pricing;
  
  // Apply member discount if applicable
  let discount = 0;
  if (membershipType && pricing.memberDiscounts) {
    const memberDiscount = pricing.memberDiscounts.find((d: any) => d.membershipType === membershipType);
    if (memberDiscount) {
      discount = memberDiscount.discountPercentage;
    }
  }

  let totalPrice = 0;

  if (pricing.type === 'tiered' && pricing.tiers) {
    let remainingDuration = duration;
    
    for (const tier of pricing.tiers) {
      if (remainingDuration <= 0) break;
      
      const tierDuration = tier.duration ? Math.min(remainingDuration, tier.duration) : remainingDuration;
      totalPrice += (tierDuration / 60) * tier.price; // Convert minutes to hours for calculation
      
      if (tier.duration) {
        remainingDuration -= tier.duration;
      } else {
        break; // Unlimited tier
      }
    }
  } else if (pricing.basePrice) {
    // Simple hourly/daily pricing
    const hours = duration / 60;
    totalPrice = hours * pricing.basePrice;
  }

  // Apply discount
  if (discount > 0) {
    totalPrice = totalPrice * (1 - discount / 100);
  }

  return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
};

productTypeSchema.methods.getAvailableAmenities = function(): string[] {
  return [...this.amenities.included, ...this.amenities.optional.map((a: any) => a.name)];
};

productTypeSchema.methods.canAccommodate = function(requiredCapacity: number): boolean {
  return requiredCapacity >= this.capacity.minCapacity && requiredCapacity <= this.capacity.maxCapacity;
};

productTypeSchema.methods.isOperational = function(): boolean {
  return this.isActive && this.capacity.minCapacity > 0;
};

productTypeSchema.methods.generateSpaceName = function(sequenceNumber: number): string {
  const { prefix, digits } = this.autoGeneration.naming;
  const paddedNumber = sequenceNumber.toString().padStart(digits, '0');
  return `${prefix}${paddedNumber}`;
};

// Indexes for multi-tenant support and performance
productTypeSchema.index({ organizationId: 1, locationId: 1, code: 1 }, { unique: true });
productTypeSchema.index({ organizationId: 1, locationId: 1, category: 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, isActive: 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, accessLevel: 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, displayOrder: 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, 'capacity.minCapacity': 1, 'capacity.maxCapacity': 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, 'pricing.type': 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, tags: 1 });
productTypeSchema.index({ organizationId: 1, locationId: 1, isHighlight: 1 });
productTypeSchema.index({ createdAt: -1 });

// Pre-save middleware for validation
productTypeSchema.pre('save', function(next) {
  // Validate pricing tiers if tiered pricing
  if (this.pricing.type === 'tiered') {
    if (!this.pricing.tiers || this.pricing.tiers.length === 0) {
      return next(new Error('Tiered pricing requires at least one pricing tier'));
    }
  }

  // Ensure optimal capacity is reasonable
  if (this.capacity.optimalCapacity < this.capacity.minCapacity) {
    this.capacity.optimalCapacity = this.capacity.minCapacity;
  }
  if (this.capacity.optimalCapacity > this.capacity.maxCapacity) {
    this.capacity.optimalCapacity = this.capacity.maxCapacity;
  }

  next();
});

// Pre-save middleware to validate custom operating hours
productTypeSchema.pre('save', function(next) {
  if (this.operatingHours && !this.operatingHours.useLocationDefault && this.operatingHours.customHours) {
    const days = this.operatingHours.customHours.map(h => h.day);
    const uniqueDays = new Set(days);
    
    if (uniqueDays.size !== days.length) {
      return next(new Error('Custom operating hours cannot have duplicate days'));
    }
  }
  
  next();
});

export const ProductType = mongoose.model<IProductType>('ProductType', productTypeSchema);