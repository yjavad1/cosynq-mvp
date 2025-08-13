import { Schema, model, Document, Types } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  _id: Types.ObjectId;
  messageId: string; // WhatsApp message ID
  contactId?: Types.ObjectId; // Reference to Contact model
  phoneNumber: string; // Phone number (E.164 format)
  direction: 'inbound' | 'outbound';
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template';
  content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: string;
    templateName?: string;
    templateParams?: string[];
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
  };
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  timestamp: Date;
  conversationId?: string; // WhatsApp conversation ID
  context?: {
    quotedMessageId?: string; // If replying to a message
    forwardedFrom?: string;
  };
  metadata: {
    whatsappTimestamp?: number;
    deliveredAt?: Date;
    readAt?: Date;
    failureReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WhatsAppMessageSchema = new Schema<IWhatsAppMessage>({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    sparse: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v: string) {
        // Basic E.164 format validation
        return /^\+[1-9]\d{1,14}$/.test(v);
      },
      message: 'Phone number must be in E.164 format'
    }
  },
  direction: {
    type: String,
    required: true,
    enum: ['inbound', 'outbound'],
    index: true
  },
  messageType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'template'],
    index: true
  },
  content: {
    text: String,
    mediaUrl: String,
    mediaType: String,
    templateName: String,
    templateParams: [String],
    location: {
      latitude: Number,
      longitude: Number,
      name: String,
      address: String
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
    default: 'pending',
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    sparse: true,
    index: true
  },
  context: {
    quotedMessageId: String,
    forwardedFrom: String
  },
  metadata: {
    whatsappTimestamp: Number,
    deliveredAt: Date,
    readAt: Date,
    failureReason: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient conversation queries
WhatsAppMessageSchema.index({ phoneNumber: 1, timestamp: -1 }); // For conversation history
WhatsAppMessageSchema.index({ contactId: 1, timestamp: -1 }); // For contact message history
WhatsAppMessageSchema.index({ status: 1, direction: 1 }); // For message status queries
WhatsAppMessageSchema.index({ conversationId: 1, timestamp: 1 }); // For conversation threading

// Static methods for common queries
WhatsAppMessageSchema.statics = {
  // Get conversation history for a phone number
  async getConversationHistory(phoneNumber: string, limit = 50, skip = 0) {
    return this.find({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('contactId', 'firstName lastName email')
      .lean();
  },

  // Get undelivered outbound messages
  async getUndeliveredMessages(limit = 100) {
    return this.find({ 
      direction: 'outbound', 
      status: { $in: ['pending', 'sent'] }
    })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();
  },

  // Mark message as delivered
  async markAsDelivered(messageId: string, deliveredAt?: Date) {
    return this.findOneAndUpdate(
      { messageId },
      { 
        status: 'delivered',
        'metadata.deliveredAt': deliveredAt || new Date()
      },
      { new: true }
    );
  },

  // Mark message as read
  async markAsRead(messageId: string, readAt?: Date) {
    return this.findOneAndUpdate(
      { messageId },
      { 
        status: 'read',
        'metadata.readAt': readAt || new Date()
      },
      { new: true }
    );
  }
};

export const WhatsAppMessage = model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);