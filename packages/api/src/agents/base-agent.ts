import type {
  AgentConfig,
  AgentContext,
  AgentOutput,
  Critique,
  CritiqueType,
  Severity,
  Screenshot,
} from "@devil-advocate/shared";
import { streamCompletion, type ImageInput } from "../lib/gemini.js";
import { getSessionEmitter } from "../lib/event-emitter.js";
import { v4 as uuid } from "uuid";

export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  get name(): string {
    return this.config.name;
  }

  get type(): CritiqueType {
    return this.config.type;
  }

  protected formatHackathonContext(hackathonContext?: string): string {
    if (!hackathonContext || !hackathonContext.trim()) return "";
    return `\n\nHACKATHON CONTEXT:\n${hackathonContext}`;
  }

  protected formatScreenshotContext(screenshots?: Screenshot[]): string {
    if (!screenshots?.length) return "";
    const types = screenshots.map((s) => s.label || s.type).join(", ");
    return `\n\n[Screenshots provided: ${types}. Analyze the visual design, UI/UX, and implementation quality shown in these images.]`;
  }

  protected convertScreenshotsToImages(screenshots?: Screenshot[]): ImageInput[] | undefined {
    if (!screenshots?.length) return undefined;
    return screenshots.map((s) => ({
      data: s.data,
      mediaType: "image/png" as const,
    }));
  }

  // Whether this agent should receive screenshots for analysis
  protected shouldAnalyzeScreenshots(): boolean {
    // UX and Pitch critics benefit most from visual analysis
    return this.type === "ux" || this.type === "pitch";
  }

  protected abstract buildUserPrompt(context: AgentContext): string;

  async execute(context: AgentContext): Promise<AgentOutput> {
    const emitter = getSessionEmitter(context.sessionId);
    emitter.emit("critique:start", {
      sessionId: context.sessionId,
      agentName: this.name,
      type: this.type,
    });

    let fullResponse = "";

    // Only pass images to agents that should analyze them
    const images = this.shouldAnalyzeScreenshots()
      ? this.convertScreenshotsToImages(context.screenshots)
      : undefined;

    const response = await streamCompletion(
      this.config.systemPrompt,
      this.buildUserPrompt(context),
      {
        onText: (text) => {
          fullResponse += text;
          emitter.emit("critique:progress", {
            sessionId: context.sessionId,
            agentName: this.name,
            type: this.type,
            text,
          });
        },
      },
      images
    );

    return this.parseResponse(response);
  }

  protected parseResponse(response: string): AgentOutput {
    // Extract JSON from response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          critiques: this.normalizeCritiques(parsed.critiques || []),
          summary: parsed.summary || "",
        };
      } catch {
        // Fall through to text parsing
      }
    }

    // Fallback: create a single critique from the response
    return {
      critiques: [
        {
          id: uuid(),
          title: "Analysis Result",
          description: response,
          severity: "major" as Severity,
          impact: "See detailed analysis above",
        },
      ],
      summary: response.slice(0, 200) + "...",
    };
  }

  private normalizeCritiques(critiques: Partial<Critique>[]): Critique[] {
    return critiques.map((c) => ({
      id: c.id || uuid(),
      title: c.title || "Untitled Critique",
      description: c.description || "",
      severity: this.normalizeSeverity(c.severity),
      impact: c.impact || "",
      recommendation: c.recommendation,
    }));
  }

  private normalizeSeverity(severity: unknown): Severity {
    const valid: Severity[] = ["critical", "major", "minor", "suggestion"];
    if (typeof severity === "string" && valid.includes(severity as Severity)) {
      return severity as Severity;
    }
    return "major";
  }
}
