import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { sessions, feedback, settings, type DbSession } from "../db/schema.js";
import type {
  Session,
  SessionStatus,
  CritiqueResult,
  RebuttalResult,
  Feedback,
  CreateFeedbackInput,
  Screenshot,
} from "@devil-advocate/shared";
import { getSessionEmitter } from "./event-emitter.js";
import { captureScreenshots, isValidUrl } from "./screenshot.js";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);

function mapDbSessionToSession(dbSession: DbSession): Session {
  return {
    id: dbSession.id,
    projectIdea: dbSession.projectIdea,
    projectUrl: dbSession.projectUrl ?? undefined,
    screenshots: (dbSession.screenshots as Screenshot[]) || [],
    hackathonContext: dbSession.hackathonContext ?? undefined,
    status: dbSession.status,
    critiques: (dbSession.critiques as CritiqueResult[]) || [],
    rebuttals: (dbSession.rebuttals as RebuttalResult[]) || [],
    createdAt: dbSession.createdAt,
    completedAt: dbSession.completedAt ?? undefined,
  };
}

// Settings helpers
export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getHackathonContext(): Promise<string | null> {
  return getSetting("hackathon_context");
}

export async function setHackathonContext(context: string): Promise<void> {
  return setSetting("hackathon_context", context);
}

export interface CreateSessionInput {
  projectIdea: string;
  projectUrl?: string;
  uploadedScreenshots?: string[]; // base64 images from user
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  const { projectIdea, projectUrl, uploadedScreenshots } = input;

  // Get the global hackathon context set by admin
  const hackathonContext = await getHackathonContext();

  // Build screenshots array
  const screenshots: Screenshot[] = [];

  // Capture screenshots from URL if provided
  if (projectUrl && isValidUrl(projectUrl)) {
    try {
      console.log(`Capturing screenshots from ${projectUrl}...`);
      const captured = await captureScreenshots(projectUrl);
      screenshots.push(
        { type: "desktop", data: captured.desktop, label: "Desktop view" },
        { type: "mobile", data: captured.mobile, label: "Mobile view" }
      );
      console.log("Screenshots captured successfully");
    } catch (error) {
      console.error("Failed to capture screenshots:", error);
      // Continue without screenshots - don't block session creation
    }
  }

  // Add user-uploaded screenshots
  if (uploadedScreenshots?.length) {
    uploadedScreenshots.forEach((data, i) => {
      screenshots.push({
        type: "uploaded",
        data,
        label: `Uploaded screenshot ${i + 1}`,
      });
    });
  }

  const [dbSession] = await db
    .insert(sessions)
    .values({
      projectIdea,
      projectUrl: projectUrl || null,
      screenshots,
      hackathonContext,
    })
    .returning();

  const session = mapDbSessionToSession(dbSession);

  const emitter = getSessionEmitter(session.id);
  emitter.emit("session:created", { sessionId: session.id });

  return session;
}

export async function getSession(id: string): Promise<Session | null> {
  const [dbSession] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id));

  return dbSession ? mapDbSessionToSession(dbSession) : null;
}

export async function updateSessionStatus(
  id: string,
  status: SessionStatus
): Promise<void> {
  const completedAt = status === "completed" ? new Date() : undefined;

  await db
    .update(sessions)
    .set({ status, completedAt })
    .where(eq(sessions.id, id));

  const emitter = getSessionEmitter(id);
  emitter.emit("session:status", { sessionId: id, status });
}

export async function addCritiqueResult(
  sessionId: string,
  critique: CritiqueResult
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const updatedCritiques = [...session.critiques, critique];

  await db
    .update(sessions)
    .set({ critiques: updatedCritiques })
    .where(eq(sessions.id, sessionId));

  const emitter = getSessionEmitter(sessionId);
  emitter.emit("critique:complete", { sessionId, critique });
}

export async function addRebuttalResult(
  sessionId: string,
  rebuttal: RebuttalResult
): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const updatedRebuttals = [...session.rebuttals, rebuttal];

  await db
    .update(sessions)
    .set({ rebuttals: updatedRebuttals })
    .where(eq(sessions.id, sessionId));

  const emitter = getSessionEmitter(sessionId);
  emitter.emit("rebuttal:complete", { sessionId, rebuttal });
}

export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  const [dbFeedback] = await db
    .insert(feedback)
    .values(input)
    .returning();

  return {
    id: dbFeedback.id,
    sessionId: dbFeedback.sessionId ?? undefined,
    type: dbFeedback.type,
    category: dbFeedback.category ?? undefined,
    description: dbFeedback.description,
    url: dbFeedback.url ?? undefined,
    userAgent: dbFeedback.userAgent ?? undefined,
    createdAt: dbFeedback.createdAt,
  };
}

export async function getAllFeedback(): Promise<Feedback[]> {
  const rows = await db
    .select()
    .from(feedback)
    .orderBy(feedback.createdAt);

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId ?? undefined,
    type: row.type,
    category: row.category ?? undefined,
    description: row.description,
    url: row.url ?? undefined,
    userAgent: row.userAgent ?? undefined,
    createdAt: row.createdAt,
  }));
}
