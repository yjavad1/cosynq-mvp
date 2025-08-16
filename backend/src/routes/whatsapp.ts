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
  res.status(200).send("Test webhook OK");
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
