import express from "express";
import {
  sendMessage,
  handleWebhook,
  getConversation,
  getConversations,
  getStatus,
} from "../controllers/whatsappController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

console.log("🔧 Registering WhatsApp routes...");

// Add this BEFORE the webhook route for testing
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp routes are working!",
    timestamp: new Date().toISOString(),
    environment: {
      whatsapp_enabled: process.env.ENABLE_WHATSAPP,
      has_twilio_sid: !!process.env.TWILIO_ACCOUNT_SID,
      has_twilio_token: !!process.env.TWILIO_AUTH_TOKEN,
    },
  });
});

// Add this BEFORE the webhook route for debugging webhook specifically
router.post("/test-webhook", (req, res) => {
  console.log("=== TEST WEBHOOK CALLED ===");
  console.log("Body:", req.body);
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.get('Content-Type'));
  console.log("Body type:", typeof req.body);
  console.log("Body keys:", Object.keys(req.body || {}));
  
  // Test organization ID validation
  const testOrgId = process.env.DEFAULT_ORGANIZATION_ID || "507f1f77bcf86cd799439011";
  console.log("Test organization ID:", testOrgId);
  console.log("Is valid ObjectId:", require('mongoose').Types.ObjectId.isValid(testOrgId));
  
  // Return proper TwiML for testing
  const twilio = require('twilio');
  const twiml = new twilio.twiml.MessagingResponse();
  
  // Add a test message to TwiML if Body is provided
  if (req.body && req.body.Body) {
    twiml.message(`Test auto-response: You said "${req.body.Body}"`);
  }
  
  console.log("📤 Test TwiML response:", twiml.toString());
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

// Public webhook endpoint (no authentication required)
router.post("/webhook", handleWebhook);
console.log("✅ POST /webhook route registered (public)");

// Protected routes (require authentication)
router.use(authenticate); // Apply authentication to all routes below

router.post("/send", sendMessage);
console.log("✅ POST /send route registered (protected)");

router.get("/status", getStatus);
console.log("✅ GET /status route registered (protected)");

router.get("/conversations", getConversations);
console.log("✅ GET /conversations route registered (protected)");

router.get("/conversation/:phoneNumber", getConversation);
console.log("✅ GET /conversation/:phoneNumber route registered (protected)");

console.log("🚀 All WhatsApp routes registered successfully");

export default router;
