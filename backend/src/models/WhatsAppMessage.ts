import mongoose, { Document, Schema, Types } from "mongoose";

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface IWhatsAppMessage extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;

  // Message Details
  messageId: string; // Twilio message SID
  direction: MessageDirection;
  status: MessageStatus;

  // Participants
  fromNumber: string; // WhatsApp number (with country code)
  toNumber: string; // WhatsApp number (with country code)
  contactId?: Types.ObjectId; // Reference to Contact if exists

  // Message Content
  messageBody: string;
  mediaUrl?: string; // For images, documents, etc.
  mediaType?: string; // image, document, audio, etc.

  // Twilio Metadata
  twilioData?: {
    accountSid: string;
    messagingServiceSid?: string;
    numSegments?: number;
    price?: string;
    priceUnit?: string;
    apiVersion?: string;
  };

  // Conversation Tracking
  conversationId: string; // Group messages by phone number
  isAutoReply?: boolean;

  // Timestamps
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppMessageSchema = new Schema<IWhatsAppMessage>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
      index: true,
    },
    fromNumber: {
      type: String,
      required: true,
      index: true,
    },
    toNumber: {
      type: String,
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      index: true,
    },
    messageBody: {
      type: String,
      required: true,
      maxlength: 4096, // WhatsApp limit
    },
    mediaUrl: {
      type: String,
      maxlength: 500,
    },
    mediaType: {
      type: String,
      maxlength: 50,
    },
    twilioData: {
      accountSid: String,
      messagingServiceSid: String,
      numSegments: Number,
      price: String,
      priceUnit: String,
      apiVersion: String,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    isAutoReply: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      required: true,
      index: true,
    },
    deliveredAt: Date,
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
whatsAppMessageSchema.index({
  organizationId: 1,
  conversationId: 1,
  sentAt: -1,
});
whatsAppMessageSchema.index({ organizationId: 1, direction: 1, sentAt: -1 });
whatsAppMessageSchema.index({ organizationId: 1, status: 1 });
whatsAppMessageSchema.index({ fromNumber: 1, toNumber: 1, sentAt: -1 });

export const WhatsAppMessage = mongoose.model<IWhatsAppMessage>(
  "WhatsAppMessage",
  whatsAppMessageSchema
);
