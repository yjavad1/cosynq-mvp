import express from "express";
import authRoutes from "./auth";
import contactRoutes from "./contacts";
import spaceRoutes from "./spaces";
import locationRoutes from "./locations";
import productTypeRoutes from "./productTypes";
import bookingRoutes from "./bookings";
import onboardingRoutes from "./onboarding";
import whatsappRoutes from "./whatsapp";

const router = express.Router();

// Debug logging for route registration
console.log("🔧 Registering API routes...");

router.use("/whatsapp", whatsappRoutes);
console.log("✅ WhatsApp routes registered at /api/whatsapp");

router.use("/auth", authRoutes);
console.log("✅ Auth routes registered at /api/auth");

router.use("/contacts", contactRoutes);
console.log("✅ Contact routes registered at /api/contacts");

router.use("/spaces", spaceRoutes);
console.log("✅ Space routes registered at /api/spaces");

router.use("/locations", locationRoutes);
console.log("✅ Location routes registered at /api/locations");

router.use("/product-types", productTypeRoutes);
console.log("✅ Product Type routes registered at /api/product-types");

router.use("/bookings", bookingRoutes);
console.log("✅ Booking routes registered at /api/bookings");

router.use("/onboarding", onboardingRoutes);
console.log("✅ Onboarding routes registered at /api/onboarding");

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Cosynq API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    port: process.env.PORT || "8000",
    availableRoutes: [
      "GET /api/health",
      "GET /api/routes",
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/profile",
      "POST /api/auth/logout",
      "GET /api/contacts",
      "POST /api/contacts",
      "GET /api/contacts/stats",
      "GET /api/contacts/:id",
      "PUT /api/contacts/:id",
      "DELETE /api/contacts/:id",
      "POST /api/contacts/:id/interactions",
      "PATCH /api/contacts/:id/context-state",
      "GET /api/contacts/:id/ai-context",
      "GET /api/contacts/:id/conversation-prompts",
      "GET /api/spaces",
      "POST /api/spaces",
      "GET /api/spaces/stats",
      "GET /api/spaces/availability",
      "GET /api/spaces/:id",
      "PUT /api/spaces/:id",
      "DELETE /api/spaces/:id",
      "GET /api/spaces/:spaceId/availability",
      "GET /api/locations",
      "POST /api/locations",
      "GET /api/locations/stats",
      "GET /api/locations/:id",
      "PUT /api/locations/:id",
      "DELETE /api/locations/:id",
      "GET /api/locations/:id/hours",
      "GET /api/product-types",
      "POST /api/product-types",
      "GET /api/product-types/stats",
      "GET /api/product-types/:id",
      "PUT /api/product-types/:id",
      "DELETE /api/product-types/:id",
      "POST /api/product-types/:id/generate-spaces",
      "GET /api/bookings",
      "POST /api/bookings",
      "GET /api/bookings/stats",
      "GET /api/bookings/:id",
      "PUT /api/bookings/:id",
      "DELETE /api/bookings/:id",
      "GET /api/onboarding/status",
      "PUT /api/onboarding/data",
      "POST /api/onboarding/complete",
      "POST /api/onboarding/reset",
    ],
  });
});

// Add a debug route to list all registered routes
router.get("/routes", (_req, res) => {
  const routes: any[] = [];

  function extractRoutes(stack: any[], basePath = "") {
    stack.forEach((layer) => {
      if (layer.route) {
        // Direct route
        const methods = Object.keys(layer.route.methods);
        routes.push({
          path: basePath + layer.route.path,
          methods: methods,
          type: "route",
        });
      } else if (layer.name === "router" && layer.handle.stack) {
        // Router middleware
        const path = layer.regexp.source
          .replace("\\/?(?=\\/|$)", "")
          .replace(/\\\//g, "/")
          .replace(/\^/, "")
          .replace(/\$/, "");
        extractRoutes(layer.handle.stack, basePath + "/" + path);
      }
    });
  }

  extractRoutes(router.stack, "/api");

  res.json({
    success: true,
    message: "Registered routes",
    timestamp: new Date().toISOString(),
    routes: routes,
  });
});

console.log("✅ Health route registered at /api/health");
console.log("🚀 All API routes registered successfully");

export default router;
