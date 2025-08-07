import mongoose, { Document, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'guest';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  
  // Onboarding fields
  onboardingCompleted: boolean;
  onboardingSkipped: boolean;
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
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  requiresOnboarding(): boolean;
  markOnboardingCompleted(skipOnboarding?: boolean): void;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['admin', 'member', 'guest'],
    default: 'member'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Onboarding fields
  onboardingCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  onboardingSkipped: {
    type: Boolean,
    default: false
  },
  onboardingCompletedAt: {
    type: Date
  },
  onboardingData: {
    companyName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    hasCreatedLocation: {
      type: Boolean,
      default: false
    },
    hasCreatedSpace: {
      type: Boolean,
      default: false
    },
    hasConfiguredPricing: {
      type: Boolean,
      default: false
    },
    completionSteps: [{
      type: String,
      enum: ['company', 'locations', 'spaces', 'pricing', 'launch']
    }]
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

userSchema.methods.requiresOnboarding = function(): boolean {
  return !this.onboardingCompleted && !this.onboardingSkipped;
};

userSchema.methods.markOnboardingCompleted = function(skipOnboarding: boolean = false): void {
  this.onboardingCompleted = true;
  this.onboardingSkipped = skipOnboarding;
  this.onboardingCompletedAt = new Date();
  
  if (!this.onboardingData) {
    this.onboardingData = {};
  }
  
  if (skipOnboarding) {
    this.onboardingData.completionSteps = ['company']; // Mark at least company step as completed
  }
};

userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ emailVerificationToken: 1 });

export const User = mongoose.model<IUser>('User', userSchema);