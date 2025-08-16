import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import twilioWhatsAppService, {
  SendMessageRequest,
} from "../services/twilioWhatsappService";
import { WhatsAppMessage } from "../models/WhatsAppMessage";
import * as Joi from "joi";
import mongoose from "mongoose";
import twilio from "twilio";

// Validation schemas
const sendMessageSchema = Joi.object({
  toNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in international format (e.g., +1234567890)",
    }),
  messageBody: Joi.string().min(1).max(4096).required(),
  contactId: Joi.string().optional(),
});

const webhookSchema = Joi.object({
  MessageSid: Joi.string().required(),
  AccountSid: Joi.string().required(),
  From: Joi.string().required(),
  To: Joi.string().required(),
  Body: Joi.string().required(),
  NumSegments: Joi.string().optional(),
  MediaUrl0: Joi.string().optional(),
  MediaContentType0: Joi.string().optional(),
});

// Helper function to ensure user is authenticated
const ensureAuthenticated = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return false;
  }
  return true;
};

// Check if WhatsApp feature is enabled
const isWhatsAppEnabled = () => {
  return process.env.ENABLE_WHATSAPP === "true";
};

/**
 * Send a WhatsApp message
 */
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isWhatsAppEnabled()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp service is currently disabled",
      });
    }

    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id.toString();

    console.log("=== SEND WHATSAPP MESSAGE REQUEST ===");
    console.log("Organization ID:", organizationId);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      console.error("Validation error:", error.details);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    const sendRequest: SendMessageRequest = {
      organizationId,
      toNumber: value.toNumber,
      messageBody: value.messageBody,
      contactId: value.contactId,
    };

    const message = await twilioWhatsAppService.sendMessage(sendRequest);

    console.log("✅ WhatsApp message sent successfully");

    res.status(201).json({
      success: true,
      message: "WhatsApp message sent successfully",
      data: { message },
    });
  } catch (error: any) {
    console.error("❌ Error sending WhatsApp message:", error);

    // Handle specific Twilio errors
    if (error.code && error.status) {
      return res.status(400).json({
        success: false,
        message: `Twilio error: ${error.message}`,
        error: {
          code: error.code,
          status: error.status,
        },
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send WhatsApp message",
      error: error.message,
    });
  }
};

/**
 * Handle incoming WhatsApp messages via Twilio webhook
 */
export const handleWebhook = async (req: Request, res: Response) => {
  // Create TwiML response object
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    if (!isWhatsAppEnabled()) {
      console.log("⚠️ WhatsApp webhook received but service is disabled");
      // Return empty TwiML response when service is disabled
      res.writeHead(200, {'Content-Type': 'text/xml'});
      return res.end(twiml.toString());
    }

    console.log("=== INCOMING WHATSAPP WEBHOOK ===");
    console.log("Webhook body:", JSON.stringify(req.body, null, 2));
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Content-Type:", req.get('Content-Type'));
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", Object.keys(req.body || {}));

    const { error, value } = webhookSchema.validate(req.body);
    if (error) {
      console.error("Webhook validation error:", error.details);
      // Return empty TwiML response for validation errors
      res.writeHead(200, {'Content-Type': 'text/xml'});
      return res.end(twiml.toString());
    }

    // TODO: In production, you should verify the webhook signature
    // to ensure it's actually from Twilio

    // Get organization ID from environment or create a default one
    // In a multi-tenant setup, you'd determine this from the webhook data or route
    let organizationId: string;
    
    if (process.env.DEFAULT_ORGANIZATION_ID) {
      organizationId = process.env.DEFAULT_ORGANIZATION_ID;
    } else {
      // Create a default ObjectId if none is configured
      // This should be replaced with proper organization mapping in production
      organizationId = "507f1f77bcf86cd799439011"; // Default MongoDB ObjectId
      console.log("⚠️ Using default organizationId. Set DEFAULT_ORGANIZATION_ID in environment.");
    }

    console.log("📋 Processing webhook for organizationId:", organizationId);

    try {
      const message = await twilioWhatsAppService.processIncomingMessage(
        value,
        organizationId
      );

      console.log("✅ Incoming message processed successfully");
      console.log("💾 Message saved with ID:", message._id);

      // Send auto-response if enabled
      if (process.env.ENABLE_AUTO_RESPONSES === "true") {
        const fromNumber = value.From.replace("whatsapp:", "");
        const autoResponseMessage = await twilioWhatsAppService.sendAutoResponse(
          organizationId,
          fromNumber,
          value.Body,
          message.contactId?.toString()
        );

        // If an auto-response was generated, add it to TwiML
        if (autoResponseMessage) {
          console.log("🤖 Adding auto-response to TwiML:", autoResponseMessage.messageBody);
          twiml.message(autoResponseMessage.messageBody);
        }
      }
    } catch (processError) {
      console.error("❌ Error processing webhook:", processError);
      // Don't fail the webhook - continue with empty TwiML response
    }

    // Always respond with proper TwiML XML
    console.log("📤 Sending TwiML response:", twiml.toString());
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());

  } catch (error: any) {
    console.error("❌ Webhook handler error:", error);
    // Return empty TwiML response even on errors
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
  }
};

/**
 * Get conversation history
 */
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    if (!isWhatsAppEnabled()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp service is currently disabled",
      });
    }

    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id.toString();

    const { phoneNumber } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    console.log("=== GET CONVERSATION REQUEST ===");
    console.log("Organization ID:", organizationId);
    console.log("Phone Number:", phoneNumber);
    console.log("Limit:", limit);

    // Validate phone number format
    if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid phone number format. Use international format (e.g., +1234567890)",
      });
    }

    const messages = await twilioWhatsAppService.getConversation(
      organizationId,
      phoneNumber,
      limit
    );

    console.log(`✅ Found ${messages.length} messages in conversation`);

    res.json({
      success: true,
      data: {
        phoneNumber,
        messageCount: messages.length,
        messages: messages.reverse(), // Show oldest first
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation",
      error: error.message,
    });
  }
};

/**
 * Get all conversations for the organization
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (!isWhatsAppEnabled()) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp service is currently disabled",
      });
    }

    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    console.log("=== GET CONVERSATIONS REQUEST ===");
    console.log("Organization ID:", organizationId);

    // Aggregate conversations by conversationId with latest message
    const conversations = await WhatsAppMessage.aggregate([
      { $match: { organizationId } },
      { $sort: { sentAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          latestMessage: { $first: "$$ROOT" },
          messageCount: { $sum: 1 },
          lastActivity: { $max: "$sentAt" },
        },
      },
      { $sort: { lastActivity: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Get total count
    const totalConversations = await WhatsAppMessage.aggregate([
      { $match: { organizationId } },
      { $group: { _id: "$conversationId" } },
      { $count: "total" },
    ]);

    const total = totalConversations[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Found ${conversations.length} conversations`);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: page,
          totalPages,
          totalConversations: total,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
      error: error.message,
    });
  }
};

/**
 * Get WhatsApp service status
 */
export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureAuthenticated(req, res)) return;
    const organizationId = req.user!._id;

    const enabled = isWhatsAppEnabled();

    if (!enabled) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          message: "WhatsApp service is disabled",
        },
      });
    }

    // Get basic stats
    const [totalMessages, totalConversations] = await Promise.all([
      WhatsAppMessage.countDocuments({ organizationId }),
      WhatsAppMessage.aggregate([
        { $match: { organizationId } },
        { $group: { _id: "$conversationId" } },
        { $count: "total" },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        enabled: true,
        twilioNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        stats: {
          totalMessages,
          totalConversations: totalConversations[0]?.total || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("❌ Error getting WhatsApp status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get WhatsApp status",
      error: error.message,
    });
  }
};
