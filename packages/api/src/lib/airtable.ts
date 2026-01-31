import Airtable from "airtable";
import type { Feedback } from "@devil-advocate/shared";

// Configure Airtable
// Use Personal Access Token (PAT) - create at https://airtable.com/create/tokens
const accessToken = process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.AIRTABLE_TABLE_NAME || "Feedback";

let base: Airtable.Base | null = null;

function getBase(): Airtable.Base | null {
  if (!accessToken || !baseId) {
    console.warn("Airtable not configured: missing AIRTABLE_PAT or AIRTABLE_BASE_ID");
    return null;
  }

  if (!base) {
    Airtable.configure({ apiKey: accessToken });
    base = Airtable.base(baseId);
  }

  return base;
}

export async function syncFeedbackToAirtable(feedback: Feedback): Promise<void> {
  const airtableBase = getBase();
  if (!airtableBase) return;

  try {
    await airtableBase(tableName).create([
      {
        fields: {
          ID: feedback.id,
          Type: feedback.type,
          Category: feedback.category || "",
          Description: feedback.description,
          "Session ID": feedback.sessionId || "",
          URL: feedback.url || "",
          "User Agent": feedback.userAgent || "",
          "Created At": feedback.createdAt.toISOString(),
        },
      },
    ]);
    console.log(`Synced feedback ${feedback.id} to Airtable`);
  } catch (error) {
    console.error("Failed to sync feedback to Airtable:", error);
    // Don't throw - Airtable sync is non-blocking
  }
}

export function isAirtableConfigured(): boolean {
  return Boolean(apiKey && baseId);
}
