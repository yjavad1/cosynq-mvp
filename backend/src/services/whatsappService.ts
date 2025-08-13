import axios from 'axios';
import { WhatsAppMessage, IWhatsAppMessage } from '../models/WhatsAppMessage';
import { Contact } from '../models/Contact';
import { Types } from 'mongoose';

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
}

interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body' | 'header';
      parameters: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

interface IncomingWhatsAppMessage {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      field: 'messages';
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
            caption?: string;
          };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
          context?: {
            from: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'delivered' | 'read' | 'sent' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
    }>;
  }>;
}

export class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0'
    };
    
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}`;
    
    if (!this.config.accessToken || !this.config.phoneNumberId) {
      console.warn('WhatsApp configuration missing. WhatsApp features will be disabled.');
    }
  }

  // Webhook verification for WhatsApp
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      console.log('WhatsApp webhook verified successfully');
      return challenge;
    }
    console.warn('WhatsApp webhook verification failed');
    return null;
  }

  // Process incoming webhook data
  async processIncomingWebhook(body: IncomingWhatsAppMessage): Promise<void> {
    try {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Process incoming messages
            if (change.value.messages) {
              for (const message of change.value.messages) {
                await this.processIncomingMessage(message, change.value.contacts[0]);
              }
            }

            // Process message status updates
            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                await this.processMessageStatus(status);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  // Process individual incoming message
  private async processIncomingMessage(message: any, contact: any): Promise<void> {
    try {
      const phoneNumber = `+${message.from}`;
      
      // Find or create contact
      let existingContact = await Contact.findOne({ phone: phoneNumber });
      if (!existingContact && contact?.profile?.name) {
        // Create new contact from WhatsApp profile
        existingContact = await Contact.create({
          firstName: contact.profile.name.split(' ')[0] || 'WhatsApp',
          lastName: contact.profile.name.split(' ').slice(1).join(' ') || 'Contact',
          phone: phoneNumber,
          source: 'whatsapp',
          tags: ['whatsapp-contact'],
          metadata: {
            whatsappProfile: {
              name: contact.profile.name,
              waId: contact.wa_id
            }
          }
        });
        console.log(`Created new contact from WhatsApp: ${phoneNumber}`);
      }

      // Create message content based on type
      const content: any = {};
      let messageType = message.type as string;

      switch (message.type) {
        case 'text':
          content.text = message.text?.body;
          break;
        case 'image':
          content.mediaUrl = await this.getMediaUrl(message.image.id);
          content.mediaType = message.image.mime_type;
          content.text = message.image.caption;
          break;
        case 'location':
          content.location = {
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            name: message.location.name,
            address: message.location.address
          };
          break;
        default:
          console.log(`Unhandled message type: ${message.type}`);
          return;
      }

      // Save message to database
      const whatsappMessage = await WhatsAppMessage.create({
        messageId: message.id,
        contactId: existingContact?._id,
        phoneNumber,
        direction: 'inbound',
        messageType,
        content,
        status: 'delivered', // Inbound messages are already delivered
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        context: message.context ? {
          quotedMessageId: message.context.id
        } : undefined,
        metadata: {
          whatsappTimestamp: parseInt(message.timestamp)
        }
      });

      console.log(`Processed inbound WhatsApp message: ${message.id} from ${phoneNumber}`);

      // TODO: Trigger AI response processing here
      // await this.processWithAI(whatsappMessage);

    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  // Process message status updates
  private async processMessageStatus(status: any): Promise<void> {
    try {
      const updateData: any = {
        status: status.status
      };

      if (status.status === 'delivered') {
        updateData['metadata.deliveredAt'] = new Date(parseInt(status.timestamp) * 1000);
      } else if (status.status === 'read') {
        updateData['metadata.readAt'] = new Date(parseInt(status.timestamp) * 1000);
      } else if (status.status === 'failed' && status.errors) {
        updateData['metadata.failureReason'] = status.errors.map((e: any) => e.message).join(', ');
      }

      await WhatsAppMessage.findOneAndUpdate(
        { messageId: status.id },
        updateData
      );

      console.log(`Updated message status: ${status.id} -> ${status.status}`);
    } catch (error) {
      console.error('Error processing message status:', error);
    }
  }

  // Send text message
  async sendTextMessage(phoneNumber: string, text: string, contactId?: Types.ObjectId): Promise<string> {
    try {
      const messageData: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber.replace('+', ''),
        type: 'text',
        text: {
          body: text
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const messageId = response.data.messages[0].id;

      // Save outbound message to database
      await WhatsAppMessage.create({
        messageId,
        contactId,
        phoneNumber,
        direction: 'outbound',
        messageType: 'text',
        content: { text },
        status: 'sent',
        timestamp: new Date(),
        metadata: {
          whatsappTimestamp: Math.floor(Date.now() / 1000)
        }
      });

      console.log(`Sent WhatsApp message: ${messageId} to ${phoneNumber}`);
      return messageId;

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Send template message
  async sendTemplateMessage(
    phoneNumber: string, 
    templateName: string, 
    languageCode: string = 'en',
    parameters?: string[],
    contactId?: Types.ObjectId
  ): Promise<string> {
    try {
      const messageData: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      if (parameters && parameters.length > 0) {
        messageData.template.components = [{
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param
          }))
        }];
      }

      const response = await axios.post(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const messageId = response.data.messages[0].id;

      // Save outbound message to database
      await WhatsAppMessage.create({
        messageId,
        contactId,
        phoneNumber,
        direction: 'outbound',
        messageType: 'template',
        content: { 
          templateName,
          templateParams: parameters 
        },
        status: 'sent',
        timestamp: new Date(),
        metadata: {
          whatsappTimestamp: Math.floor(Date.now() / 1000)
        }
      });

      console.log(`Sent WhatsApp template message: ${messageId} to ${phoneNumber}`);
      return messageId;

    } catch (error) {
      console.error('Error sending WhatsApp template message:', error);
      throw error;
    }
  }

  // Get media URL from WhatsApp media ID
  private async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('Error fetching media URL:', error);
      return '';
    }
  }

  // Get conversation history for a phone number
  async getConversationHistory(phoneNumber: string, limit = 50, skip = 0): Promise<IWhatsAppMessage[]> {
    return WhatsAppMessage.find({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('contactId', 'firstName lastName email')
      .lean();
  }

  // Format phone number to E.164 format
  static formatPhoneNumber(phoneNumber: string, defaultCountryCode = '+91'): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If no + and doesn't start with country code, add default
    if (!cleaned.startsWith('+')) {
      // Handle Indian numbers specifically
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 10) {
        cleaned = defaultCountryCode + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }

  // Check if service is configured
  isConfigured(): boolean {
    return !!(this.config.accessToken && this.config.phoneNumberId);
  }
}

export const whatsappService = new WhatsAppService();