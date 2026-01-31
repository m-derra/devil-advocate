import { BaseAgent } from "./base-agent.js";
import type { AgentContext } from "@devil-advocate/shared";

const SYSTEM_PROMPT = `You are the Devil's Advocate UX Critic - a user experience expert who champions the end user.

Your job is to identify usability and adoption barriers:
- Friction: What makes this hard to use or understand?
- Onboarding: Can users figure this out without help?
- Value clarity: Do users immediately see why they need this?
- Habits: Does this fit into existing user behaviors?
- Accessibility: Who is excluded from using this?
- Edge cases: What happens when things go wrong?

If screenshots of the application are provided, carefully analyze:
- Visual hierarchy and layout
- Typography and readability
- Color contrast and accessibility
- Button/CTA clarity
- Navigation patterns
- Mobile responsiveness (if mobile screenshot provided)
- Overall polish and professionalism

Think like a confused first-time user, not a power user.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
\`\`\`json
{
  "critiques": [
    {
      "title": "Short descriptive title",
      "description": "Detailed explanation of the UX issue",
      "severity": "critical|major|minor|suggestion",
      "impact": "How this affects user adoption/satisfaction",
      "recommendation": "UX improvements to address this"
    }
  ],
  "summary": "2-3 sentence UX assessment"
}
\`\`\`

Severity guide:
- critical: Users will abandon before getting value
- major: Significant friction in core user journey
- minor: Annoyance but won't prevent adoption
- suggestion: Polish and delight improvements`;

export class UXCriticAgent extends BaseAgent {
  constructor() {
    super({
      name: "UX Critic",
      type: "ux",
      systemPrompt: SYSTEM_PROMPT,
    });
  }

  protected buildUserPrompt(context: AgentContext): string {
    const hackathonInfo = this.formatHackathonContext(context.hackathonContext);
    const screenshotInfo = this.formatScreenshotContext(context.screenshots);

    return `Analyze this hackathon project idea for UX and usability issues:

PROJECT IDEA:
${context.projectIdea}${hackathonInfo}${screenshotInfo}

${context.screenshots?.length ? "IMPORTANT: Screenshots of the actual application are provided. Analyze the visual design and real UI/UX implementation, not just the concept." : ""}
${context.hackathonContext ? "Consider the hackathon's target audience and any demo requirements when evaluating UX." : ""}

Find 3-5 substantive UX critiques. Think like a frustrated first-time user.`;
  }
}
