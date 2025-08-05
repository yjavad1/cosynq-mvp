import mongoose, { Document, Schema, Types } from 'mongoose';

export type ContactType = 'Lead' | 'Member' | 'Prospect';
export type ContextState = 'New' | 'Touring' | 'Negotiating' | 'Active' | 'Inactive' | 'Churned';

export interface IContactInteraction {
  _id: Types.ObjectId;
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
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IContact extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
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
    spaceRequirements?: string[];
    lastContextUpdate: Date;
  };
  
  interactions: IContactInteraction[];
  
  leadSource?: string;
  assignedTo?: Types.ObjectId;
  
  membership?: {
    planType?: string;
    startDate?: Date;
    endDate?: Date;
    monthlyRate?: number;
  };
  
  priority: 'low' | 'medium' | 'high';
  
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  getFullName(): string;
  addInteraction(interaction: Omit<IContactInteraction, '_id' | 'createdAt'>): void;
  updateContextState(newState: ContextState, reason?: string): void;
}

const contactInteractionSchema = new Schema<IContactInteraction>({
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'note', 'tour', 'ai_conversation'],
    required: true
  },
  subject: {
    type: String,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  metadata: {
    aiModel: String,
    aiContext: String,
    duration: Number,
    outcome: String,
    nextActions: [String]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const contactSchema = new Schema<IContact>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Lead', 'Member', 'Prospect'],
    required: true,
    index: true
  },
  contextState: {
    type: String,
    enum: ['New', 'Touring', 'Negotiating', 'Active', 'Inactive', 'Churned'],
    default: 'New',
    index: true
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
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: 100
  },
  address: {
    street: { type: String, maxlength: 200 },
    city: { type: String, maxlength: 100 },
    state: { type: String, maxlength: 50 },
    zipCode: { type: String, maxlength: 20 },
    country: { type: String, maxlength: 50, default: 'US' }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  aiContext: {
    preferences: [String],
    interests: [String],
    painPoints: [String],
    budget: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    spaceRequirements: [String],
    lastContextUpdate: { type: Date, default: Date.now }
  },
  interactions: [contactInteractionSchema],
  leadSource: {
    type: String,
    trim: true,
    maxlength: 100
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  membership: {
    planType: String,
    startDate: Date,
    endDate: Date,
    monthlyRate: Number
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
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

contactSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

contactSchema.methods.addInteraction = function(interaction: Omit<IContactInteraction, '_id' | 'createdAt'>): void {
  this.interactions.push({
    ...interaction,
    _id: new mongoose.Types.ObjectId()
  });
  this.aiContext.lastContextUpdate = new Date();
};

contactSchema.methods.updateContextState = function(newState: ContextState, reason?: string): void {
  const previousState = this.contextState;
  this.contextState = newState;
  
  if (reason) {
    this.addInteraction({
      type: 'note',
      subject: `Context State Change: ${previousState} → ${newState}`,
      content: reason,
      createdBy: this.updatedBy
    });
  }
  
  this.aiContext.lastContextUpdate = new Date();
};

contactSchema.index({ organizationId: 1, email: 1 }, { unique: true });
contactSchema.index({ organizationId: 1, type: 1 });
contactSchema.index({ organizationId: 1, contextState: 1 });
contactSchema.index({ organizationId: 1, assignedTo: 1 });
contactSchema.index({ organizationId: 1, priority: 1 });
contactSchema.index({ organizationId: 1, 'aiContext.lastContextUpdate': -1 });
contactSchema.index({ tags: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ createdAt: -1 });

export const Contact = mongoose.model<IContact>('Contact', contactSchema);