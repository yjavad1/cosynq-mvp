import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'No Show';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  spaceId: Types.ObjectId;
  contactId?: Types.ObjectId; // Optional - can be booked by non-contacts
  resourceUnitId?: Types.ObjectId; // Optional - for pooled resources
  
  // Booking Details
  startTime: Date;
  endTime: Date;
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
  paymentStatus: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  
  // Check-in/Check-out
  checkedIn: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  
  // Metadata
  bookingReference: string; // Unique booking reference
  notes?: string;
  cancelReason?: string;
  
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  getDuration(): number; // in minutes
  isActive(): boolean;
  canBeCancelled(): boolean;
  canBeModified(): boolean;
}

const bookingSchema = new Schema<IBooking>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  spaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Space',
    required: true,
    index: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    index: true
  },
  resourceUnitId: {
    type: Schema.Types.ObjectId,
    ref: 'ResourceUnit',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'No Show'],
    default: 'Pending',
    index: true
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  customerPhone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: 200
  },
  attendeeCount: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    length: 3
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
    default: 'Pending',
    index: true
  },
  checkedIn: {
    type: Boolean,
    default: false,
    index: true
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^BK[A-Z0-9]{8}$/
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  cancelReason: {
    type: String,
    trim: true,
    maxlength: 500
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

// Instance methods
bookingSchema.methods.getDuration = function(): number {
  return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
};

bookingSchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === 'Confirmed' && 
         this.startTime <= now && 
         this.endTime > now;
};

bookingSchema.methods.canBeCancelled = function(): boolean {
  const now = new Date();
  const hoursUntilStart = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return this.status === 'Pending' || 
         (this.status === 'Confirmed' && hoursUntilStart >= 2); // 2 hours cancellation policy
};

bookingSchema.methods.canBeModified = function(): boolean {
  const now = new Date();
  const hoursUntilStart = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return (this.status === 'Pending' || this.status === 'Confirmed') && 
         hoursUntilStart >= 4; // 4 hours modification policy
};

// Pre-save middleware to generate booking reference
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    // Generate a unique booking reference: BK + 8 random alphanumeric characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = 'BK';
    for (let i = 0; i < 8; i++) {
      reference += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingReference = reference;
  }
  next();
});

// Validation: End time must be after start time
bookingSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Indexes for performance
bookingSchema.index({ organizationId: 1, startTime: 1 });
bookingSchema.index({ organizationId: 1, endTime: 1 });
bookingSchema.index({ organizationId: 1, status: 1 });
bookingSchema.index({ organizationId: 1, paymentStatus: 1 });
bookingSchema.index({ spaceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ contactId: 1, startTime: -1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ bookingReference: 1 });

// Compound index for conflict checking
bookingSchema.index({ 
  organizationId: 1,
  spaceId: 1, 
  startTime: 1, 
  endTime: 1,
  status: 1 
});

// Index for resource unit queries
bookingSchema.index({ 
  organizationId: 1,
  resourceUnitId: 1,
  startTime: 1,
  endTime: 1,
  status: 1 
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);