import express from "express";
import { getAnalytics } from "../controllers/analyticscontroller";

const router = express.Router();

console.log("📊 Registering analytics routes...");

// Main analytics endpoint - allow both auth and fallback like WhatsApp
router.get("/", async (req, res, next) => {
  // Don't require authentication, let controller handle fallback
  return getAnalytics(req as any, res);
});

console.log("✅ GET /analytics route registered");

export default router;
