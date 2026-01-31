import { Router } from "express";
import { z } from "zod";
import { createFeedback, getAllFeedback } from "../lib/session-store.js";
import { syncFeedbackToAirtable } from "../lib/airtable.js";

const router = Router();

const createFeedbackSchema = z.object({
  sessionId: z.string().uuid().optional(),
  type: z.enum(["feature_request", "bug_report", "general"]),
  category: z.enum(["ui", "agents", "output", "performance", "other"]).optional(),
  description: z.string().min(5, "Description must be at least 5 characters"),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

// Create feedback
router.post("/", async (req, res) => {
  try {
    const parsed = createFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const feedback = await createFeedback(parsed.data);

    // Sync to Airtable (non-blocking)
    syncFeedbackToAirtable(feedback).catch((err) => {
      console.error("Airtable sync failed:", err);
    });

    res.json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ error: "Failed to create feedback" });
  }
});

// Get all feedback (admin)
router.get("/", async (_req, res) => {
  try {
    const feedback = await getAllFeedback();
    res.json({ feedback, total: feedback.length });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Export feedback as JSON (for Product OS integration)
router.get("/export", async (_req, res) => {
  try {
    const feedback = await getAllFeedback();

    // Format for Product OS customer feedback format
    const exported = feedback.map((f) => ({
      id: f.id,
      type: f.type,
      category: f.category,
      description: f.description,
      timestamp: f.createdAt.toISOString(),
      source: "devil-advocate",
      sessionId: f.sessionId,
    }));

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="devil-advocate-feedback-${Date.now()}.json"`
    );
    res.json(exported);
  } catch (error) {
    console.error("Error exporting feedback:", error);
    res.status(500).json({ error: "Failed to export feedback" });
  }
});

export default router;
