import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSession } from "../lib/api";
import type { Session, CritiqueType } from "@devil-advocate/shared";
import { CritiqueCard } from "../components/critique-card";
import {
  Loader2,
  AlertCircle,
  Download,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Zap,
} from "lucide-react";

const critiqueTypeLabels: Record<CritiqueType, { title: string; icon: string }> = {
  technical: { title: "Technical Critique", icon: "🔧" },
  business: { title: "Business Critique", icon: "💼" },
  ux: { title: "UX Critique", icon: "🎨" },
  pitch: { title: "Pitch Critique", icon: "🎤" },
};

export function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    getSession(id)
      .then((data) => {
        setSession(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [id]);

  const generateMarkdown = () => {
    if (!session) return "";

    let md = `# Devil's Advocate Report\n\n`;
    md += `## Project Idea\n\n${session.projectIdea}\n\n`;

    if (session.projectUrl) {
      md += `**Project URL:** ${session.projectUrl}\n\n`;
    }

    if (session.hackathonContext) {
      md += `## Hackathon Context\n\n${session.hackathonContext}\n\n`;
    }

    md += `---\n\n`;

    for (const critique of session.critiques) {
      md += `## ${critiqueTypeLabels[critique.type].title}\n\n`;
      md += `**Summary:** ${critique.summary}\n\n`;

      for (const c of critique.critiques) {
        md += `### ${c.title}\n\n`;
        md += `**Severity:** ${c.severity}\n\n`;
        md += `${c.description}\n\n`;
        md += `**Impact:** ${c.impact}\n\n`;
        if (c.recommendation) {
          md += `**Recommendation:** ${c.recommendation}\n\n`;
        }

        const rebuttal = session.rebuttals.find((r) => r.critiqueId === c.id);
        if (rebuttal) {
          md += `#### Prepared Defense\n\n`;
          md += `${rebuttal.defense}\n\n`;
          if (rebuttal.keyPoints.length > 0) {
            md += `**Key Points:**\n`;
            rebuttal.keyPoints.forEach((p) => {
              md += `- ${p}\n`;
            });
            md += `\n`;
          }
          if (rebuttal.suggestedEvidence) {
            md += `**Evidence to Show:** ${rebuttal.suggestedEvidence}\n\n`;
          }
        }
        md += `---\n\n`;
      }
    }

    return md;
  };

  const handleCopy = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devils-advocate-report-${id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-[var(--color-ember)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-mist)]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-[var(--color-flame)]" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-light)] mb-2">
            {error || "Session not found"}
          </h2>
          <button
            onClick={() => navigate("/devil")}
            className="mt-6 text-[var(--color-ember)] hover:text-[var(--color-spark)] transition-colors"
          >
            Start a new critique
          </button>
        </div>
      </div>
    );
  }

  const totalCritiques = session.critiques.reduce(
    (sum, c) => sum + c.critiques.length,
    0
  );
  const criticalCount = session.critiques.reduce(
    (sum, c) => sum + c.critiques.filter((cr) => cr.severity === "critical").length,
    0
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-[var(--color-ash)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/devil" className="btn btn-ghost p-2 rounded-lg flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <defs>
                    <linearGradient id="reportFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="50%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M50 10 C30 30 20 50 25 70 C28 85 40 95 50 95 C60 95 72 85 75 70 C80 50 70 30 50 10 Z M40 60 C35 70 40 80 50 80 C60 80 65 70 60 60 C55 50 45 50 40 60 Z"
                    fill="url(#reportFlame)"
                  />
                </svg>

                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-xl font-semibold text-[var(--color-light)] truncate">
                    Critique Report
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-mist)] truncate">
                    Your complete analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button onClick={handleCopy} className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2">
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button onClick={handleDownload} className="btn btn-primary text-xs sm:text-sm px-2 sm:px-3 py-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center animate-slide-up">
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-amber)]" />
            </div>
            <div className="font-display text-2xl sm:text-4xl font-bold text-gradient">{totalCritiques}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Total Issues
            </div>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center animate-slide-up stagger-1">
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-flame)]" />
            </div>
            <div className="font-display text-2xl sm:text-4xl font-bold text-[var(--color-flame)]">{criticalCount}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Critical
            </div>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center animate-slide-up stagger-2">
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
            <div className="font-display text-2xl sm:text-4xl font-bold text-green-400">{session.rebuttals.length}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Defenses
            </div>
          </div>
        </div>

        {/* Project summary */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 animate-slide-up stagger-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2 sm:mb-3">
            Your Project Idea
          </h2>
          <p className="text-sm sm:text-lg text-[var(--color-light)] leading-relaxed">
            {session.projectIdea}
          </p>

          {session.hackathonContext && (
            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[var(--color-ash)]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2 sm:mb-3 flex items-center gap-2">
                <span className="text-base">🏆</span> Hackathon Context
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-cloud)] whitespace-pre-wrap">
                {session.hackathonContext}
              </p>
            </div>
          )}
        </div>

        {/* Critiques by type */}
        {session.critiques.map((critiqueResult, sectionIndex) => {
          const typeInfo = critiqueTypeLabels[critiqueResult.type];
          return (
            <section
              key={critiqueResult.type}
              className="mb-6 sm:mb-10 opacity-0 animate-slide-up"
              style={{ animationDelay: `${0.4 + sectionIndex * 0.1}s` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">{typeInfo.icon}</span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-light)]">
                  {typeInfo.title}
                </h2>
              </div>

              <div className="card rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-amber)] flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-base text-[var(--color-cloud)] leading-relaxed">
                  {critiqueResult.summary}
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {critiqueResult.critiques.map((critique) => (
                  <CritiqueCard
                    key={critique.id}
                    critique={critique}
                    rebuttal={session.rebuttals.find(
                      (r) => r.critiqueId === critique.id
                    )}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer CTA */}
        <div className="text-center py-12 border-t border-[var(--color-ash)]">
          <Link
            to="/devil"
            className="text-[var(--color-ember)] hover:text-[var(--color-spark)] transition-colors font-medium"
          >
            Start a new critique →
          </Link>
        </div>
      </main>
    </div>
  );
}
