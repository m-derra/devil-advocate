import type { Critique, CritiqueType, RebuttalResult } from "@devil-advocate/shared";
import { streamCompletion } from "../lib/claude.js";
import { getSessionEmitter } from "../lib/event-emitter.js";

const SYSTEM_PROMPT = `You are a Defense Strategist helping hackathon teams prepare rebuttals to critiques.

Your job is to:
- Acknowledge valid concerns honestly
- Provide strong defensive arguments
- Suggest evidence or demonstrations that would address the critique
- Help them turn weaknesses into strengths

Be realistic - don't promise the impossible. Good rebuttals acknowledge limitations while showing a path forward.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
\`\`\`json
{
  "defense": "A 2-3 sentence defense addressing the critique",
  "keyPoints": ["Point 1 to make", "Point 2 to make", "Point 3 to make"],
  "suggestedEvidence": "What they could show/demo to prove their point"
}
\`\`\``;

export class RebuttalAgent {
  private formatHackathonContext(hackathonContext?: string): string {
    if (!hackathonContext || !hackathonContext.trim()) return "";
    return `\n\nHACKATHON CONTEXT:\n${hackathonContext}`;
  }

  async generateRebuttal(
    sessionId: string,
    critique: Critique,
    critiqueType: CritiqueType,
    projectIdea: string,
    hackathonContext?: string
  ): Promise<RebuttalResult> {
    const emitter = getSessionEmitter(sessionId);
    emitter.emit("rebuttal:start", {
      sessionId,
      critiqueId: critique.id,
      critiqueType,
    });

    const hackathonInfo = this.formatHackathonContext(hackathonContext);

    const userPrompt = `Generate a rebuttal for this critique of a hackathon project:

PROJECT IDEA:
${projectIdea}${hackathonInfo}

CRITIQUE (${critiqueType}):
Title: ${critique.title}
Description: ${critique.description}
Severity: ${critique.severity}
Impact: ${critique.impact}

${hackathonContext ? "Frame the defense in terms of how it addresses the hackathon's judging criteria and requirements." : ""}

Help them defend against this critique constructively.`;

    let fullResponse = "";
    const response = await streamCompletion(SYSTEM_PROMPT, userPrompt, {
      onText: (text) => {
        fullResponse += text;
        emitter.emit("rebuttal:progress", {
          sessionId,
          critiqueId: critique.id,
          text,
        });
      },
    });

    const parsed = this.parseResponse(response, critique.id, critiqueType);

    emitter.emit("rebuttal:complete", {
      sessionId,
      rebuttal: parsed,
    });

    return parsed;
  }

  private parseResponse(
    response: string,
    critiqueId: string,
    critiqueType: CritiqueType
  ): RebuttalResult {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          critiqueId,
          critiqueType,
          defense: parsed.defense || "",
          keyPoints: parsed.keyPoints || [],
          suggestedEvidence: parsed.suggestedEvidence,
        };
      } catch {
        // Fall through
      }
    }

    return {
      critiqueId,
      critiqueType,
      defense: response,
      keyPoints: [],
    };
  }
}
