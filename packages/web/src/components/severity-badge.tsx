import type { Severity } from "@devil-advocate/shared";

const severityConfig: Record<Severity, { class: string; label: string }> = {
  critical: { class: "badge-critical", label: "Critical" },
  major: { class: "badge-major", label: "Major" },
  minor: { class: "badge-minor", label: "Minor" },
  suggestion: { class: "badge-suggestion", label: "Suggestion" },
};

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span className={`badge ${config.class}`}>
      {config.label}
    </span>
  );
}
