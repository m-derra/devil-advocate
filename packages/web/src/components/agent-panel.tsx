import type { CritiqueType, CritiqueResult } from "@devil-advocate/shared";
import { CritiqueCard } from "./critique-card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import type { RebuttalResult } from "@devil-advocate/shared";

const agentInfo: Record<
  CritiqueType,
  { name: string; icon: string; description: string; gradient: string }
> = {
  technical: {
    name: "Technical Critic",
    icon: "🔧",
    description: "Feasibility, scalability, complexity",
    gradient: "from-blue-500/10 to-cyan-500/5",
  },
  business: {
    name: "Business Critic",
    icon: "💼",
    description: "Market fit, competition, monetization",
    gradient: "from-emerald-500/10 to-green-500/5",
  },
  ux: {
    name: "UX Critic",
    icon: "🎨",
    description: "Usability, adoption, friction",
    gradient: "from-purple-500/10 to-pink-500/5",
  },
  pitch: {
    name: "Pitch Critic",
    icon: "🎤",
    description: "Presentation, Q&A readiness",
    gradient: "from-amber-500/10 to-orange-500/5",
  },
};

interface AgentPanelProps {
  type: CritiqueType;
  result?: CritiqueResult;
  rebuttals: RebuttalResult[];
  isActive: boolean;
  progress?: string;
}

export function AgentPanel({
  type,
  result,
  rebuttals,
  isActive,
  progress,
}: AgentPanelProps) {
  const info = agentInfo[type];

  return (
    <div className={`card rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br ${info.gradient}`}>
      {/* Header */}
      <div className="p-3 sm:p-5 border-b border-[var(--color-ash)]">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-2xl sm:text-3xl">{info.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--color-light)] flex items-center gap-2">
              {info.name}
              {isActive && (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-ember)] animate-spin" />
              )}
              {result && !isActive && (
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
              )}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-mist)] truncate">{info.description}</p>
          </div>
          {result && (
            <div className="text-right flex-shrink-0">
              <span className="font-display text-2xl sm:text-3xl font-bold text-gradient">
                {result.critiques.length}
              </span>
              <p className="text-[10px] sm:text-xs text-[var(--color-mist)] font-mono uppercase tracking-wider">
                issues
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator when active */}
      {isActive && (
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-ash)] bg-[var(--color-abyss)]/50">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-ember)] animate-pulse mt-1.5 sm:mt-2 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-[var(--color-cloud)] line-clamp-3 leading-relaxed">
              {progress || "Analyzing your project..."}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="p-3 sm:p-5">
          {/* Summary */}
          <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-5 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[var(--color-abyss)]/50 border border-[var(--color-ash)]">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-amber)] flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[var(--color-cloud)] leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Critiques */}
          <div className="space-y-2 sm:space-y-3">
            {result.critiques.map((critique, i) => (
              <div
                key={critique.id}
                className="opacity-0 animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CritiqueCard
                  critique={critique}
                  rebuttal={rebuttals.find((r) => r.critiqueId === critique.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !isActive && (
        <div className="p-6 sm:p-10 text-center">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 opacity-30">{info.icon}</div>
          <p className="text-[var(--color-slate)] text-xs sm:text-sm">Waiting to analyze...</p>
        </div>
      )}
    </div>
  );
}
