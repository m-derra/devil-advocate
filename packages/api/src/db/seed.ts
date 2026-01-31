import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { settings } from "./schema.js";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const AI_BEAVERS_CONTEXT = `Hackathon: AI BEAVERS 2026 - Germany's Biggest AI Hackathon
Dates: January 31 - February 1, 2026 (48 hours)
Participants: 400+
Location: Germany (SF vibe)

=== SUBMISSION FORMAT (5 Miro Slides, 2 min pitch + 2 min demo + 2 min Q&A) ===

Slide 1: The Market Problem
- Who has this problem? (be specific: "B2B sales teams," not "businesses")
- How big is this market? (# of companies, users, spend)
- How do they solve it today and why does that suck?
(Investors fund markets, not features.)

Slide 2: Your Solution
- What you built in one sentence
- Why is your approach 10x better than alternatives?
(Keep it short. Just enough to understand what it does.)

Slide 3: Business Model
- Who pays?
- How much would they pay?
- What's the unit economics? (e.g., $50/mo subscription, costs $5 to serve)
(Show you've thought about how money works.)

Slide 4: Go-to-Market Plan
- How would you get your first 10 customers? (be specific: "DM 50 founders in YC W25 batch")
- What's your distribution advantage? (existing audience? community? partner?)
- What would make someone switch from their current solution?
(This is the hardest part. Show you have a real plan, not "post on social media.")

Slide 5: Why You / Why Now
- Why are you the right team to build this?
- What did you learn in 48 hours that makes you more confident?
- Would you work on this full-time if it got traction?
(Judges invest in founders who won't quit.)

=== FAIR PLAY RULES ===

✅ OK to bring:
- An idea, notes, sketches, research
- Generic starter templates you reuse for any project (boilerplate)
- Third-party tools + open source + sponsor tech (respect licenses)

❌ NOT OK:
- A mostly finished product and "just polishing" on-site
- Project-specific code/features built before the hackathon that make up the core of your submission

We judge what you build AT the hackathon. Projects that violate rules may be penalized or removed from awards.

Best Practices:
- Commit early, commit often (use git throughout)
- Create your repo at kickoff
- Ship a working demo slice early, then improve it (stability wins)

Integrity checks: Automated AI agent checks + human review for pre-built work.

=== PRIZES ($280,000+ total) ===

Best Project Overall (powered by Plancraft & Superhuman):
1st: $5,000 cash + $3,500 Cursor + $10,000 OpenAI + $15,000 Gemini + ElevenLabs Pro + Hume AI Pro + Miro Team + Superhuman Pro + Manus Pro + MiniMax
2nd: $5,000 OpenAI + $1,000 Cursor + $5,000 Gemini + Hume AI + Superhuman + Manus + MiniMax
3rd: $1,000 OpenAI + $500 Cursor + $1,000 Gemini + Hume AI + Superhuman + Manus + MiniMax

Sponsor Tracks:
- Google Gemini: Best use of Gemini API (top 3 get credits), Antigravity ($5k each), Nano Banana ($5k)
- ElevenLabs: 6 months Scale tier
- n8n: 1 year Pro license (top 3)
- Manus: $1,000 cash
- Langchain: $2,000 credits
- v0: $2,000 credits
- MiniMax: $500 cash + $1,000 API credits (top 3)

=== JUDGING ===
Judges from Amazon, Apple, Netflix, and more.
Goal: Prove this could become a real business.

Team size: Solo or up to 5 (recommended: 3)`;

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert hackathon context (upsert)
  await db
    .insert(settings)
    .values({
      key: "hackathon_context",
      value: AI_BEAVERS_CONTEXT,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: AI_BEAVERS_CONTEXT, updatedAt: new Date() },
    });

  console.log("✅ Hackathon context seeded");
  console.log("🌱 Seeding complete!");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
