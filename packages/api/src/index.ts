import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sessionsRouter from "./routes/sessions.js";
import feedbackRouter from "./routes/feedback.js";
import settingsRouter from "./routes/settings.js";
import authRouter from "./routes/auth.js";
import {
  generalLimiter,
  sessionCreationLimiter,
  authLimiter,
  dailyLimitMiddleware,
  honeypotMiddleware,
  inputSanitizer,
  getUsageStats,
} from "./lib/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for accurate IP detection (Railway, Vercel, etc.)
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Reduced from 50mb for security

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Global rate limit on all routes
app.use(generalLimiter);

// Daily limit tracking (for AI cost control)
app.use(dailyLimitMiddleware);

// Health check (before other middlewares)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Usage stats endpoint (for monitoring)
app.get("/api/stats", (_req, res) => {
  res.json(getUsageStats());
});

// ============================================
// ROUTES WITH SPECIFIC PROTECTION
// ============================================

// Sessions - strictest limits (AI calls = cost)
app.use(
  "/api/sessions",
  sessionCreationLimiter, // 10 per hour per IP
  honeypotMiddleware, // Catch bots
  inputSanitizer, // Validate input
  sessionsRouter
);

// Auth - brute force protection
app.use("/api/auth", authLimiter, authRouter);

// Other routes - general protection only
app.use("/api/feedback", feedbackRouter);
app.use("/api/settings", settingsRouter);

// ============================================
// STATIC FILES (Production)
// ============================================

// Serve static files from public directory (built frontend)
const publicPath = path.join(__dirname, "..", "public");
app.use(express.static(publicPath));

// SPA fallback - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🔥 Devil's Advocate API running on http://localhost:${PORT}`);
  console.log(`🛡️  Security: Rate limiting enabled, daily limit: 800 requests`);
});
