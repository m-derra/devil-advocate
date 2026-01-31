import Airtable from "airtable";
import type { Feedback } from "@devil-advocate/shared";

// Configure Airtable
// Use Personal Access Token (PAT) - create at https://airtable.com/create/tokens
const accessToken = process.env.AIRTABLE_PAT;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.AIRTABLE_TABLE_NAME || "Table 1";

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
    // Map to existing Airtable fields: "Name" and "Notes"
    const name = `[${feedback.type}] ${feedback.category || "general"} - ${feedback.id.slice(0, 8)}`;
    const notes = [
      `Description: ${feedback.description}`,
      `Type: ${feedback.type}`,
      `Category: ${feedback.category || "N/A"}`,
      `Session ID: ${feedback.sessionId || "N/A"}`,
      `URL: ${feedback.url || "N/A"}`,
      `Created: ${feedback.createdAt.toISOString()}`,
      `ID: ${feedback.id}`,
    ].join("\n");

    await airtableBase(tableName).create([
      {
        fields: {
          Name: name,
          Notes: notes,
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
  return Boolean(accessToken && baseId);
}
