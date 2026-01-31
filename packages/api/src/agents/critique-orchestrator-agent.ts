import type {
  Session,
  CritiqueResult,
  AgentContext,
} from "@devil-advocate/shared";
import { TechnicalCriticAgent } from "./technical-critic-agent.js";
import { BusinessCriticAgent } from "./business-critic-agent.js";
import { UXCriticAgent } from "./ux-critic-agent.js";
import { PitchCriticAgent } from "./pitch-critic-agent.js";
import { RebuttalAgent } from "./rebuttal-agent.js";
import {
  updateSessionStatus,
  addCritiqueResult,
  addRebuttalResult,
} from "../lib/session-store.js";
import { getSessionEmitter } from "../lib/event-emitter.js";

export class CritiqueOrchestratorAgent {
  private technicalAgent = new TechnicalCriticAgent();
  private businessAgent = new BusinessCriticAgent();
  private uxAgent = new UXCriticAgent();
  private pitchAgent = new PitchCriticAgent();
  private rebuttalAgent = new RebuttalAgent();

  async orchestrate(session: Session): Promise<void> {
    const emitter = getSessionEmitter(session.id);
    const context: AgentContext = {
      sessionId: session.id,
      projectIdea: session.projectIdea,
      hackathonContext: session.hackathonContext,
      screenshots: session.screenshots,
    };

    try {
      // Phase 1: Run all critics in parallel
      await updateSessionStatus(session.id, "critiquing");

      const critiquePromises = [
        this.runCritic(this.technicalAgent, context),
        this.runCritic(this.businessAgent, context),
        this.runCritic(this.uxAgent, context),
        this.runCritic(this.pitchAgent, context),
      ];

      const critiqueResults = await Promise.all(critiquePromises);

      // Save all critique results
      for (const result of critiqueResults) {
        await addCritiqueResult(session.id, result);
      }

      // Phase 2: Generate rebuttals for top critiques
      await updateSessionStatus(session.id, "rebutting");

      // Get top 2 critiques from each category (by severity)
      const allCritiques = critiqueResults.flatMap((result) =>
        result.critiques.slice(0, 2).map((critique) => ({
          critique,
          type: result.type,
        }))
      );

      // Run rebuttals in parallel
      const rebuttalPromises = allCritiques.map(({ critique, type }) =>
        this.rebuttalAgent.generateRebuttal(
          session.id,
          critique,
          type,
          session.projectIdea,
          session.hackathonContext
        )
      );

      const rebuttals = await Promise.all(rebuttalPromises);

      // Save all rebuttals
      for (const rebuttal of rebuttals) {
        await addRebuttalResult(session.id, rebuttal);
      }

      // Mark complete
      await updateSessionStatus(session.id, "completed");
      emitter.emit("session:complete", { sessionId: session.id });
    } catch (error) {
      console.error("Orchestration error:", error);
      await updateSessionStatus(session.id, "error");
      emitter.emit("session:error", {
        sessionId: session.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private async runCritic(
    agent: { execute: (ctx: AgentContext) => Promise<{ critiques: unknown[]; summary: string }>; name: string; type: string },
    context: AgentContext
  ): Promise<CritiqueResult> {
    const output = await agent.execute(context);
    return {
      type: agent.type as CritiqueResult["type"],
      agentName: agent.name,
      critiques: output.critiques as CritiqueResult["critiques"],
      summary: output.summary,
      completedAt: new Date(),
    };
  }
}
