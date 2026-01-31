import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

// ============================================
// RATE LIMITING - Prevent abuse
// ============================================

// Strict limit for session creation (AI calls = cost)
// 50 sessions per IP per hour (generous for hackathon demo)
export const sessionCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour per IP
  message: { error: "Too many sessions created. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
});

// General API rate limit
// 100 requests per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
});

// Auth endpoint protection (prevent brute force)
// 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIP(req),
});

// ============================================
// GLOBAL DAILY LIMIT - Stay within free tier
// ============================================

let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 800; // Stay under 1000 free tier limit with buffer

export function dailyLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Reset counter at midnight
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
    console.log(`[Security] Daily counter reset. New day: ${today}`);
  }

  // Only count session creation (actual AI calls)
  if (req.path === "/api/sessions" && req.method === "POST") {
    if (dailyRequestCount >= DAILY_LIMIT) {
      console.warn(`[Security] Daily limit reached: ${dailyRequestCount}/${DAILY_LIMIT}`);
      return res.status(429).json({
        error: "Daily limit reached. Service will reset at midnight UTC.",
        resetAt: getNextMidnightUTC(),
      });
    }
    dailyRequestCount++;
    console.log(`[Security] Daily usage: ${dailyRequestCount}/${DAILY_LIMIT}`);
  }

  next();
}

// ============================================
// HONEYPOT - Catch bots
// ============================================

export function honeypotMiddleware(req: Request, res: Response, next: NextFunction) {
  // If a hidden field is filled, it's likely a bot
  if (req.body?.website || req.body?.url_confirm || req.body?._hp) {
    console.warn(`[Security] Honeypot triggered from IP: ${getClientIP(req)}`);
    // Return fake success to not alert the bot
    return res.json({ sessionId: "fake-" + Math.random().toString(36).slice(2) });
  }
  next();
}

// ============================================
// INPUT VALIDATION - Prevent abuse
// ============================================

export function inputSanitizer(req: Request, res: Response, next: NextFunction) {
  if (req.body?.projectIdea) {
    const idea = req.body.projectIdea;

    // Limit input length (prevent massive prompts)
    if (idea.length > 10000) {
      return res.status(400).json({ error: "Project description too long. Maximum 10,000 characters." });
    }

    // Check for obvious spam patterns
    const spamPatterns = [
      /(.)\1{20,}/, // Same character repeated 20+ times
      /(https?:\/\/[^\s]+\s*){10,}/, // 10+ URLs
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(idea)) {
        console.warn(`[Security] Spam detected from IP: ${getClientIP(req)}`);
        return res.status(400).json({ error: "Invalid input detected." });
      }
    }
  }

  next();
}

// ============================================
// HELPERS
// ============================================

function getClientIP(req: Request): string {
  // Handle proxies (Railway, Vercel, etc.)
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function getNextMidnightUTC(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Export usage stats for monitoring
export function getUsageStats() {
  return {
    dailyRequests: dailyRequestCount,
    dailyLimit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - dailyRequestCount,
    resetDate: lastResetDate,
  };
}
