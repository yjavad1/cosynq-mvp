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
