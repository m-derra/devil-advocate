import { Router } from "express";
import { z } from "zod";
import {
  createSession,
  getSession,
} from "../lib/session-store.js";
import { getSessionEmitter } from "../lib/event-emitter.js";
import { CritiqueOrchestratorAgent } from "../agents/critique-orchestrator-agent.js";
import type { SSEEventType } from "@devil-advocate/shared";

const router = Router();

const createSessionSchema = z.object({
  projectIdea: z.string().min(10, "Project idea must be at least 10 characters"),
  projectUrl: z.string().url().optional(),
  screenshots: z.array(z.string()).optional(), // base64 images
});

// Create a new critique session
router.post("/", async (req, res) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const session = await createSession({
      projectIdea: parsed.data.projectIdea,
      projectUrl: parsed.data.projectUrl,
      uploadedScreenshots: parsed.data.screenshots,
    });

    // Start orchestration in background
    const orchestrator = new CritiqueOrchestratorAgent();
    orchestrator.orchestrate(session).catch(console.error);

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get session by ID
router.get("/:id", async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// SSE stream for session updates
router.get("/:id/stream", async (req, res) => {
  const session = await getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const emitter = getSessionEmitter(session.id);

  // Subscribe to all relevant events
  const eventTypes: SSEEventType[] = [
    "session:status",
    "critique:start",
    "critique:progress",
    "critique:complete",
    "rebuttal:start",
    "rebuttal:progress",
    "rebuttal:complete",
    "session:complete",
    "session:error",
  ];

  const unsubscribers: (() => void)[] = [];

  for (const eventType of eventTypes) {
    const unsubscribe = emitter.on(eventType, (event) => {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    });
    unsubscribers.push(unsubscribe);
  }

  // Send initial state
  res.write(`event: session:init\n`);
  res.write(`data: ${JSON.stringify(session)}\n\n`);

  // Clean up on close
  req.on("close", () => {
    unsubscribers.forEach((unsub) => unsub());
  });
});

export default router;
