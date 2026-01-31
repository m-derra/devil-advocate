import type { Critique, RebuttalResult } from "@devil-advocate/shared";
import { SeverityBadge } from "./severity-badge";
import { ChevronDown, ChevronUp, Shield, Zap } from "lucide-react";
import { useState } from "react";

interface CritiqueCardProps {
  critique: Critique;
  rebuttal?: RebuttalResult;
}

export function CritiqueCard({ critique, rebuttal }: CritiqueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card rounded-lg sm:rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 sm:p-5 text-left hover:bg-[var(--color-smoke)]/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
              <SeverityBadge severity={critique.severity} />
              {rebuttal && (
                <span className="badge badge-success flex items-center gap-1 text-[10px] sm:text-xs">
                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Defense Ready</span>
                  <span className="sm:hidden">Ready</span>
                </span>
              )}
            </div>
            <h3 className="font-display text-sm sm:text-lg font-semibold text-[var(--color-light)] leading-tight">
              {critique.title}
            </h3>
          </div>
          <div className="flex-shrink-0 text-[var(--color-slate)]">
            {expanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-3 sm:space-y-5 animate-fade-in">
          <div className="divider" />

          <div>
            <h4 className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-1.5 sm:mb-2">
              <Zap className="w-3 h-3" />
              Issue
            </h4>
            <p className="text-xs sm:text-base text-[var(--color-cloud)] leading-relaxed">
              {critique.description}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-1.5 sm:mb-2">
              Impact
            </h4>
            <p className="text-xs sm:text-base text-[var(--color-cloud)] leading-relaxed">
              {critique.impact}
            </p>
          </div>

          {critique.recommendation && (
            <div>
              <h4 className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-1.5 sm:mb-2">
                Recommendation
              </h4>
              <p className="text-xs sm:text-base text-[var(--color-cloud)] leading-relaxed">
                {critique.recommendation}
              </p>
            </div>
          )}

          {rebuttal && (
            <div className="mt-3 sm:mt-5 p-3 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-950/30 to-emerald-950/20 border border-green-900/30">
              <h4 className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-400 mb-2 sm:mb-3">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Prepared Defense
              </h4>
              <p className="text-xs sm:text-base text-[var(--color-cloud)] leading-relaxed mb-3 sm:mb-4">
                {rebuttal.defense}
              </p>

              {rebuttal.keyPoints.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <h5 className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-1.5 sm:mb-2">
                    Key Points
                  </h5>
                  <ul className="space-y-1 sm:space-y-1.5">
                    {rebuttal.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[var(--color-cloud)]">
                        <span className="text-green-500 mt-0.5 sm:mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rebuttal.suggestedEvidence && (
                <div className="pt-2 sm:pt-3 border-t border-green-900/30">
                  <h5 className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-1.5 sm:mb-2">
                    Evidence to Show
                  </h5>
                  <p className="text-xs sm:text-sm text-[var(--color-cloud)] italic">
                    "{rebuttal.suggestedEvidence}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
