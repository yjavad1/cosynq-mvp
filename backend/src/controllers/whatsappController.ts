import { Request, Response } from 'express';
import { whatsappService, WhatsAppService } from '../services/whatsappService';
import { WhatsAppMessage } from '../models/WhatsAppMessage';
import { Contact } from '../models/Contact';
import crypto from 'crypto';

// Webhook verification endpoint
export const verifyWebhook = (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    console.log('WhatsApp webhook verification request:', { mode, token, challenge });

    const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);
    
    if (verificationResult) {
      console.log('WhatsApp webhook verified successfully');
      return res.status(200).send(verificationResult);
    } else {
      console.error('WhatsApp webhook verification failed');
      return res.status(403).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Webhook endpoint for receiving messages
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Verify webhook signature (optional but recommended for production)
    if (process.env.WHATSAPP_WEBHOOK_SECRET) {
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!verifyWebhookSignature(req.body, signature, process.env.WHATSAPP_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    console.log('Received WhatsApp webhook:', JSON.stringify(req.body, null, 2));

    // Process the webhook data
    await whatsappService.processIncomingWebhook(req.body);

    // Acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Send text message endpoint
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, message, contactId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Phone number and message are required' 
      });
    }

    // Format phone number
    const formattedPhoneNumber = WhatsAppService.formatPhoneNumber(phoneNumber);

    // Validate contact ID if provided
    let validContactId;
    if (contactId) {
      const contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      validContactId = contact._id;
    }

    // Send message
    const messageId = await whatsappService.sendTextMessage(
      formattedPhoneNumber, 
      message, 
      validContactId
    );

    res.status(200).json({
      success: true,
      messageId,
      phoneNumber: formattedPhoneNumber
    });

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    
    if (error.response?.data) {
      return res.status(400).json({
        error: 'WhatsApp API error',
        details: error.response.data
      });
    }

    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
};

// Send template message endpoint
export const sendTemplateMessage = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, templateName, languageCode, parameters, contactId } = req.body;

    if (!phoneNumber || !templateName) {
      return res.status(400).json({ 
        error: 'Phone number and template name are required' 
      });
    }

    // Format phone number
    const formattedPhoneNumber = WhatsAppService.formatPhoneNumber(phoneNumber);

    // Validate contact ID if provided
    let validContactId;
    if (contactId) {
      const contact = await Contact.findById(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      validContactId = contact._id;
    }

    // Send template message
    const messageId = await whatsappService.sendTemplateMessage(
      formattedPhoneNumber,
      templateName,
      languageCode || 'en',
      parameters,
      validContactId
    );

    res.status(200).json({
      success: true,
      messageId,
      phoneNumber: formattedPhoneNumber,
      templateName
    });

  } catch (error: any) {
    console.error('Error sending WhatsApp template message:', error);
    
    if (error.response?.data) {
      return res.status(400).json({
        error: 'WhatsApp API error',
        details: error.response.data
      });
    }

    res.status(500).json({
      error: 'Failed to send template message',
      details: error.message
    });
  }
};

// Get conversation history endpoint
export const getConversationHistory = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone number
    const formattedPhoneNumber = WhatsAppService.formatPhoneNumber(phoneNumber);

    // Get conversation history
    const messages = await whatsappService.getConversationHistory(
      formattedPhoneNumber,
      parseInt(limit as string),
      parseInt(skip as string)
    );

    res.status(200).json({
      success: true,
      phoneNumber: formattedPhoneNumber,
      messages,
      total: messages.length
    });

  } catch (error: unknown) {
    console.error('Error fetching conversation history:', error);
    const details = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      error: 'Failed to fetch conversation history',
      details
    });
  }
};

// Get all WhatsApp conversations endpoint
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;

    const matchStage: any = {};
    if (status && ['sent', 'delivered', 'read', 'failed', 'pending'].includes(status as string)) {
      matchStage.status = status;
    }

    // Aggregate to get latest message per phone number
    const conversations = await WhatsAppMessage.aggregate([
      { $match: matchStage },
      { $sort: { phoneNumber: 1, timestamp: -1 } },
      { 
        $group: {
          _id: '$phoneNumber',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$direction', 'inbound'] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
      { $skip: parseInt(skip as string) },
      { $limit: parseInt(limit as string) },
      {
        $lookup: {
          from: 'contacts',
          localField: 'lastMessage.contactId',
          foreignField: '_id',
          as: 'contact'
        }
      },
      {
        $addFields: {
          contact: { $arrayElemAt: ['$contact', 0] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      conversations,
      total: conversations.length
    });

  } catch (error: unknown) {
    console.error('Error fetching conversations:', error);
    const details = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({
      error: 'Failed to fetch conversations',
      details
    });
  }
};

// Get WhatsApp service status
export const getServiceStatus = async (_req: Request, res: Response) => {
  try {
    const isConfigured = whatsappService.isConfigured();
    
    const status = {
      configured: isConfigured,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? '***configured***' : 'missing',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ? '***configured***' : 'missing',
      webhookToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '***configured***' : 'missing',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    };

    res.status(200).json({
      success: true,
      status
    });

  } catch (error: unknown) {
    console.error('Error getting service status:', error);
    const details = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({
      error: 'Failed to get service status',
      details
    });
  }
};

// Utility function to verify webhook signature
function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  try {
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}