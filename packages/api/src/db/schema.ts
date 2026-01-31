import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import type {
  SessionStatus,
  CritiqueResult,
  RebuttalResult,
  FeedbackType,
  FeedbackCategory,
  Screenshot,
} from "@devil-advocate/shared";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectIdea: text("project_idea").notNull(),
  projectUrl: text("project_url"),
  screenshots: jsonb("screenshots").$type<Screenshot[]>().default([]),
  hackathonContext: text("hackathon_context"),
  status: text("status").$type<SessionStatus>().notNull().default("pending"),
  critiques: jsonb("critiques").$type<CritiqueResult[]>().default([]),
  rebuttals: jsonb("rebuttals").$type<RebuttalResult[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Global settings table for admin-configured values
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => sessions.id),
  type: text("type").$type<FeedbackType>().notNull(),
  category: text("category").$type<FeedbackCategory>(),
  description: text("description").notNull(),
  url: text("url"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DbSession = typeof sessions.$inferSelect;
export type DbFeedback = typeof feedback.$inferSelect;
