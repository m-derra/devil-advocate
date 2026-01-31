import { Router } from "express";
import { z } from "zod";
import { getHackathonContext, setHackathonContext } from "../lib/session-store.js";

const router = Router();

// Get hackathon context
router.get("/hackathon-context", async (_req, res) => {
  try {
    const context = await getHackathonContext();
    res.json({ context: context || "" });
  } catch (error) {
    console.error("Error fetching hackathon context:", error);
    res.status(500).json({ error: "Failed to fetch hackathon context" });
  }
});

// Update hackathon context
const updateContextSchema = z.object({
  context: z.string(),
});

router.put("/hackathon-context", async (req, res) => {
  try {
    const parsed = updateContextSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    await setHackathonContext(parsed.data.context);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating hackathon context:", error);
    res.status(500).json({ error: "Failed to update hackathon context" });
  }
});

export default router;
