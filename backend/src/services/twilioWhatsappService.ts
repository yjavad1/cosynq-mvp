import { Twilio } from "twilio";
import { WhatsAppMessage, IWhatsAppMessage } from "../models/WhatsAppMessage";
import { Contact } from "../models/Contact";
import mongoose from "mongoose";

export interface SendMessageRequest {
  organizationId: string;
  toNumber: string; // Format: +1234567890
  messageBody: string;
  contactId?: string;
}

export interface TwilioWebhookData {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumSegments?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

export class TwilioWhatsAppService {
  private twilioClient!: Twilio;
  private fromNumber!: string;
  private isInitialized: boolean = false;

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Check if WhatsApp service is enabled via feature flag
   */
  private isWhatsAppEnabled(): boolean {
    return process.env.ENABLE_WHATSAPP === "true";
  }

  /**
   * Initialize Twilio client only when needed and feature is enabled
   */
  private initialize(): void {
    if (this.isInitialized) return;

    if (!this.isWhatsAppEnabled()) {
      throw new Error("WhatsApp service is disabled. Set ENABLE_WHATSAPP=true to enable.");
    }

    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_WHATSAPP_NUMBER
    ) {
      throw new Error(
        "Missing Twilio credentials. Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER"
      );
    }

    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.isInitialized = true;

    console.log("✅ Twilio WhatsApp Service initialized");
  }

  constructor() {
    // Don't initialize immediately - wait until service is actually used
    console.log("📱 Twilio WhatsApp Service created (not initialized)");
  }

  /**
   * Send a WhatsApp message via Twilio
   */
  async sendMessage(request: SendMessageRequest): Promise<IWhatsAppMessage> {
    try {
      // Initialize service if not already done
      this.initialize();

      console.log("=== SENDING WHATSAPP MESSAGE ===");
      console.log("To:", request.toNumber);
      console.log("Message:", request.messageBody);

      // Validate phone number format
      if (!this.validatePhoneNumber(request.toNumber)) {
        throw new Error(`Invalid phone number format: ${request.toNumber}. Expected format: +1234567890`);
      }

      // Format numbers for WhatsApp (must include whatsapp: prefix)
      const fromWhatsApp = `whatsapp:${this.fromNumber}`;
      const toWhatsApp = `whatsapp:${request.toNumber}`;

      // Send message via Twilio
      const twilioMessage = await this.twilioClient.messages.create({
        from: fromWhatsApp,
        to: toWhatsApp,
        body: request.messageBody,
      });

      console.log("✅ Twilio message sent:", twilioMessage.sid);

      // Save message to database
      const conversationId = this.generateConversationId(
        this.fromNumber,
        request.toNumber
      );

      const whatsAppMessage = new WhatsAppMessage({
        organizationId: new mongoose.Types.ObjectId(request.organizationId),
        messageId: twilioMessage.sid,
        direction: "outbound",
        status: "sent",
        fromNumber: this.fromNumber,
        toNumber: request.toNumber,
        contactId: request.contactId
          ? new mongoose.Types.ObjectId(request.contactId)
          : undefined,
        messageBody: request.messageBody,
        conversationId,
        twilioData: {
          accountSid: twilioMessage.accountSid,
          numSegments: parseInt(twilioMessage.numSegments || "1"),
          price: twilioMessage.price || undefined,
          priceUnit: twilioMessage.priceUnit || undefined,
          apiVersion: twilioMessage.apiVersion || undefined,
        },
        sentAt: new Date(),
      });

      try {
        await whatsAppMessage.save();
        console.log("✅ Message saved to database");
      } catch (saveError) {
        console.error("❌ Failed to save message to database:", saveError);
        throw new Error("Failed to save message to database");
      }

      return whatsAppMessage;
    } catch (error) {
      console.error("❌ Error sending WhatsApp message:", error);
      throw error;
    }
  }

  /**
   * Process incoming WhatsApp message from Twilio webhook
   */
  async processIncomingMessage(
    webhookData: TwilioWebhookData,
    organizationId: string
  ): Promise<IWhatsAppMessage> {
    try {
      // Initialize service if not already done
      this.initialize();

      console.log("=== PROCESSING INCOMING WHATSAPP MESSAGE ===");
      console.log("From:", webhookData.From);
      console.log("Message:", webhookData.Body);

      // Validate webhook data
      if (!webhookData.MessageSid || !webhookData.AccountSid || !webhookData.Body) {
        throw new Error("Invalid webhook data: missing required fields");
      }

      // Extract phone numbers (remove whatsapp: prefix)
      const fromNumber = webhookData.From?.replace("whatsapp:", "") || "";
      const toNumber = webhookData.To?.replace("whatsapp:", "") || "";

      // Validate extracted phone numbers
      if (!fromNumber || !toNumber) {
        throw new Error("Invalid webhook data: missing phone numbers");
      }

      // Try to find existing contact by phone number
      const contact = await Contact.findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        phone: fromNumber,
      });

      if (contact) {
        console.log(
          "📞 Found existing contact:",
          contact.firstName,
          contact.lastName
        );
      }

      // Generate conversation ID
      const conversationId = this.generateConversationId(fromNumber, toNumber);

      // Save incoming message
      const whatsAppMessage = new WhatsAppMessage({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        messageId: webhookData.MessageSid,
        direction: "inbound",
        status: "delivered",
        fromNumber,
        toNumber,
        contactId: contact?._id,
        messageBody: webhookData.Body,
        mediaUrl: webhookData.MediaUrl0 || undefined,
        mediaType: webhookData.MediaContentType0 || undefined,
        conversationId,
        twilioData: {
          accountSid: webhookData.AccountSid,
          numSegments: parseInt(webhookData.NumSegments || "1"),
        },
        sentAt: new Date(),
      });

      try {
        await whatsAppMessage.save();
        console.log("✅ Incoming message saved to database");
      } catch (saveError) {
        console.error("❌ Failed to save incoming message to database:", saveError);
        throw new Error("Failed to save incoming message to database");
      }

      // Add interaction to contact if found
      if (contact) {
        try {
          // Check if addInteraction method exists before calling
          if (typeof contact.addInteraction === 'function') {
            contact.addInteraction({
              type: "ai_conversation",
              subject: "WhatsApp Message Received",
              content: webhookData.Body,
              metadata: {
                aiContext: `WhatsApp message: ${webhookData.MessageSid}`,
                outcome: "message_received",
              },
              createdBy: contact.createdBy,
            });
            await contact.save();
            console.log("✅ Interaction added to contact");
          } else {
            console.log("⚠️ addInteraction method not available on contact model");
          }
        } catch (interactionError) {
          console.error("❌ Error adding interaction to contact:", interactionError);
          // Don't throw - message processing should continue even if interaction fails
        }
      }

      return whatsAppMessage;
    } catch (error) {
      console.error("❌ Error processing incoming message:", error);
      throw error;
    }
  }

  /**
   * Get conversation history between two numbers
   */
  async getConversation(
    organizationId: string,
    phoneNumber: string,
    limit: number = 50
  ): Promise<IWhatsAppMessage[]> {
    try {
      // Initialize service if not already done
      this.initialize();

      const conversationId = this.generateConversationId(
        this.fromNumber,
        phoneNumber
      );

      const messages = await WhatsAppMessage.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        conversationId,
      })
        .populate("contactId", "firstName lastName email")
        .sort({ sentAt: -1 })
        .limit(limit);

      return messages;
    } catch (error) {
      console.error("❌ Error getting conversation:", error);
      throw error;
    }
  }

  /**
   * Generate consistent conversation ID for two phone numbers
   */
  private generateConversationId(number1: string, number2: string): string {
    // Sort numbers to ensure consistent conversation ID regardless of order
    const numbers = [number1, number2].sort();
    return `${numbers[0]}_${numbers[1]}`;
  }

  /**
   * Send automated response based on keywords
   */
  async sendAutoResponse(
    organizationId: string,
    toNumber: string,
    incomingMessage: string,
    contactId?: string
  ): Promise<IWhatsAppMessage | null> {
    try {
      // Initialize service if not already done
      this.initialize();

      const response = this.generateAutoResponse(incomingMessage);

      if (response) {
        console.log("🤖 Sending auto-response:", response);

        const message = await this.sendMessage({
          organizationId,
          toNumber,
          messageBody: response,
          contactId,
        });

        // Mark as auto reply
        message.isAutoReply = true;
        await message.save();

        return message;
      }

      return null;
    } catch (error) {
      console.error("❌ Error sending auto-response:", error);
      return null;
    }
  }

  /**
   * Generate automatic response based on keywords
   */
  private generateAutoResponse(incomingMessage: string): string | null {
    const message = incomingMessage.toLowerCase();

    // Basic keyword responses
    if (
      message.includes("hello") ||
      message.includes("hi") ||
      message.includes("hey")
    ) {
      return "Hello! Welcome to our coworking space. How can I help you today? You can ask about:\n\n• Space availability\n• Pricing\n• Booking a tour\n• Amenities\n\nJust type your question!";
    }

    if (
      message.includes("availability") ||
      message.includes("available") ||
      message.includes("book")
    ) {
      return "I'd be happy to help you check space availability! Could you please let me know:\n\n• What type of space? (hot desk, private office, meeting room)\n• When do you need it?\n• For how long?\n\nOr visit our booking page for real-time availability.";
    }

    if (
      message.includes("price") ||
      message.includes("cost") ||
      message.includes("pricing")
    ) {
      return "Our pricing varies by space type and duration:\n\n• Hot Desks: Starting from ₹500/day\n• Private Offices: Starting from ₹2000/day\n• Meeting Rooms: Starting from ₹200/hour\n\nWould you like specific pricing for any particular space?";
    }

    if (
      message.includes("tour") ||
      message.includes("visit") ||
      message.includes("see")
    ) {
      return "We'd love to show you around! Our team can arrange a tour at your convenience.\n\nPlease let us know:\n• Your preferred date and time\n• Contact details\n\nOr you can book directly through our website.";
    }

    if (message.includes("amenities") || message.includes("facilities")) {
      return "Our coworking space includes:\n\n• High-speed WiFi\n• Air conditioning\n• Printing & scanning\n• Meeting rooms\n• Kitchen facilities\n• Security\n• Parking\n\nWould you like more details about any specific amenity?";
    }

    if (message.includes("help") || message.includes("support")) {
      return "I'm here to help! You can ask me about:\n\n• Space availability and booking\n• Pricing and plans\n• Amenities and facilities\n• Tours and visits\n• Contact information\n\nWhat would you like to know?";
    }

    // Default response for unrecognized messages
    return "Thank you for your message! Our team will get back to you shortly. For immediate assistance, you can:\n\n• Visit our website\n• Call us during business hours\n• Book a tour online\n\nIs there anything specific I can help you with right now?";
  }
}

export default new TwilioWhatsAppService();
