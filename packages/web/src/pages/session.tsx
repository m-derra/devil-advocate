import { useParams, useNavigate, Link } from "react-router-dom";
import { useSessionStream } from "../hooks/use-session-stream";
import { AgentPanel } from "../components/agent-panel";
import { CritiqueCard } from "../components/critique-card";
import { useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Monitor,
  Smartphone,
  ImageIcon,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Zap,
  MessageSquarePlus,
  X,
} from "lucide-react";
import type { CritiqueType } from "@devil-advocate/shared";
import { submitFeedback } from "../lib/api";

const critiqueTypes: CritiqueType[] = ["technical", "business", "ux", "pitch"];

const critiqueTypeLabels: Record<CritiqueType, { title: string; icon: string }> = {
  technical: { title: "Technical Critique", icon: "🔧" },
  business: { title: "Business Critique", icon: "💼" },
  ux: { title: "UX Critique", icon: "🎨" },
  pitch: { title: "Pitch Critique", icon: "🎤" },
};

const statusMessages: Record<string, { text: string; subtext: string }> = {
  pending: { text: "Initializing", subtext: "Preparing critique session..." },
  analyzing: { text: "Analyzing", subtext: "Understanding your project..." },
  critiquing: { text: "Critiquing", subtext: "Four critics are reviewing..." },
  rebutting: { text: "Defending", subtext: "Preparing your rebuttals..." },
  completed: { text: "Complete", subtext: "Your critique is ready" },
  error: { text: "Error", subtext: "Something went wrong" },
};

export function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error, activeAgents, progress } = useSessionStream(id);
  const [copied, setCopied] = useState(false);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Show feedback prompt after user has had time to review (10 seconds)
  useEffect(() => {
    if (session?.status === "completed" && !feedbackDismissed && !feedbackSubmitted) {
      const timer = setTimeout(() => setShowFeedbackPrompt(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [session?.status, feedbackDismissed, feedbackSubmitted]);

  const handleQuickFeedback = async () => {
    if (!quickFeedback.trim() || !id) return;
    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        type: "general",
        category: "other",
        description: quickFeedback,
        sessionId: id,
        url: window.location.href,
      });
      setFeedbackSubmitted(true);
      setShowFeedbackPrompt(false);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 text-[var(--color-ember)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-mist)]">Loading session...</p>
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

  const isComplete = session.status === "completed";
  const statusInfo = statusMessages[session.status];
  const progressPercent = Math.min(
    100,
    (session.critiques.length / 4) * 80 + (session.rebuttals.length > 0 ? 20 : 0)
  );

  // Calculate stats for completed sessions
  const totalCritiques = session.critiques.reduce((sum, c) => sum + c.critiques.length, 0);
  const criticalCount = session.critiques.reduce(
    (sum, c) => sum + c.critiques.filter((cr) => cr.severity === "critical").length,
    0
  );
  const majorCount = session.critiques.reduce(
    (sum, c) => sum + c.critiques.filter((cr) => cr.severity === "major").length,
    0
  );
  const minorCount = session.critiques.reduce(
    (sum, c) => sum + c.critiques.filter((cr) => cr.severity === "minor").length,
    0
  );

  // Calculate Pitch Readiness Score
  const calculateScore = () => {
    // Use weighted severity system, normalized by total issues
    const totalIssues = criticalCount + majorCount + minorCount;
    if (totalIssues === 0) return 100;

    // Weight: critical=3, major=2, minor=1
    const weightedSum = criticalCount * 3 + majorCount * 2 + minorCount * 1;
    const maxPossibleWeight = totalIssues * 3; // if all were critical

    // Score based on how severe the issues are (not just count)
    // 100 = all minor, ~33 = all critical
    const severityScore = 100 - ((weightedSum / maxPossibleWeight) * 70);

    // Bonus for having rebuttals prepared (up to 10 points)
    const rebuttalBonus = Math.min(session.rebuttals.length * 2, 10);

    // Penalty for high total count (more than 15 issues starts to hurt)
    const countPenalty = Math.max(0, (totalIssues - 15) * 1.5);

    return Math.max(10, Math.min(100, Math.round(severityScore + rebuttalBonus - countPenalty)));
  };

  const pitchScore = isComplete ? calculateScore() : 0;

  const getScoreColor = (score: number) => {
    if (score >= 65) return "text-green-400";
    if (score >= 45) return "text-yellow-400";
    if (score >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Strong";
    if (score >= 55) return "Good";
    if (score >= 40) return "Fair";
    if (score >= 25) return "Needs Work";
    return "Critical";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 65) return "#4ade80";
    if (score >= 45) return "#facc15";
    if (score >= 30) return "#fb923c";
    return "#f87171";
  };

  // Get top 3 issues
  const getTopIssues = () => {
    const allCritiques = session.critiques.flatMap((c) =>
      c.critiques.map((cr) => ({ ...cr, type: c.type }))
    );
    const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, suggestion: 3 };
    return allCritiques
      .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
      .slice(0, 3);
  };

  const topIssues = isComplete ? getTopIssues() : [];

  // Markdown export
  const generateMarkdown = () => {
    if (!session) return "";
    let md = `# Devil's Advocate Report\n\n`;
    md += `## Project Idea\n\n${session.projectIdea}\n\n`;
    if (session.projectUrl) {
      md += `**Project URL:** ${session.projectUrl}\n\n`;
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

  return (
    <div className="min-h-screen">
      {/* Feedback Prompt Modal */}
      {showFeedbackPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ember)]/10 border border-[var(--color-ember)]/20 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 text-[var(--color-ember)]" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[var(--color-light)]">
                    How was this critique?
                  </h3>
                  <p className="text-sm text-[var(--color-mist)]">
                    Help us improve in 10 seconds
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackPrompt(false);
                  setFeedbackDismissed(true);
                }}
                className="text-[var(--color-slate)] hover:text-[var(--color-mist)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={quickFeedback}
              onChange={(e) => setQuickFeedback(e.target.value)}
              placeholder="Was anything missing? Too harsh? Not useful? Any feature you wish existed?"
              rows={3}
              className="input w-full mb-4 text-sm"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackPrompt(false);
                  setFeedbackDismissed(true);
                }}
                className="btn btn-secondary flex-1"
              >
                Skip
              </button>
              <button
                onClick={handleQuickFeedback}
                disabled={!quickFeedback.trim() || submittingFeedback}
                className="btn btn-primary flex-1"
              >
                {submittingFeedback ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Feedback"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-[var(--color-ash)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/devil" className="btn btn-ghost p-2 rounded-lg flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-10 sm:h-10 animate-flame flex-shrink-0">
                  <defs>
                    <linearGradient id="headerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="50%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M50 10 C30 30 20 50 25 70 C28 85 40 95 50 95 C60 95 72 85 75 70 C80 50 70 30 50 10 Z M40 60 C35 70 40 80 50 80 C60 80 65 70 60 60 C55 50 45 50 40 60 Z"
                    fill="url(#headerFlame)"
                  />
                </svg>

                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-xl font-semibold text-[var(--color-light)] truncate">
                    {isComplete ? "Critique Report" : statusInfo.text}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-mist)] truncate">
                    {isComplete ? "Your complete analysis" : statusInfo.subtext}
                  </p>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button onClick={handleCopy} className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-2">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button onClick={handleDownload} className="btn btn-primary text-xs sm:text-sm px-2 sm:px-3 py-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar - only show when not complete */}
      {!isComplete && (
        <div className="sticky top-[57px] sm:top-[73px] z-10 bg-[var(--color-void)]">
          <div className="h-1 bg-[var(--color-shadow)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-amber)] transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2">
            <p className="text-xs font-mono text-[var(--color-slate)]">
              {session.critiques.length}/4 critics complete
            </p>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Score Card - only show when complete */}
        {isComplete && (
          <div className="card rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-4 sm:mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Score Circle */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-ash)" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={getScoreRingColor(pitchScore)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(pitchScore / 100) * 327} 327`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-display text-4xl sm:text-5xl font-bold ${getScoreColor(pitchScore)}`}>
                    {pitchScore}
                  </span>
                  <span className="text-xs text-[var(--color-mist)] font-mono uppercase tracking-wider">/ 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-light)] mb-2">
                  Pitch Readiness: <span className={getScoreColor(pitchScore)}>{getScoreLabel(pitchScore)}</span>
                </h2>
                <p className="text-sm sm:text-base text-[var(--color-mist)] mb-4">
                  {pitchScore >= 65
                    ? "Your project is well-prepared. Address the remaining issues and you'll be ready to impress the judges."
                    : pitchScore >= 45
                    ? "Your project has potential. Focus on the critical and major issues before pitching."
                    : pitchScore >= 30
                    ? "Several significant issues need attention. Prioritize the critical problems first."
                    : "Your project has many areas to address. Review the critical issues carefully and prepare strong rebuttals."}
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {criticalCount} critical
                  </span>
                  <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {majorCount} major
                  </span>
                  <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {minorCount} minor
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Issues - only show when complete */}
        {isComplete && topIssues.length > 0 && (
          <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 animate-fade-in">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-3 flex items-center gap-2">
              <span>⚡</span> Top Issues to Address
            </h3>
            <div className="space-y-3">
              {topIssues.map((issue, i) => (
                <div key={issue.id} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-shadow)] border border-[var(--color-ash)] flex items-center justify-center text-xs font-bold text-[var(--color-mist)]">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded ${
                          issue.severity === "critical"
                            ? "bg-red-500/10 text-red-400"
                            : issue.severity === "major"
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs text-[var(--color-slate)]">{issue.type}</span>
                    </div>
                    <p className="text-sm sm:text-base text-[var(--color-light)] font-medium">{issue.title}</p>
                    {issue.recommendation && (
                      <p className="text-xs sm:text-sm text-[var(--color-mist)] mt-1 line-clamp-2">
                        💡 {issue.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats cards - only show when complete */}
        {isComplete && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8 animate-fade-in">
            <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-amber)]" />
              </div>
              <div className="font-display text-2xl sm:text-4xl font-bold text-gradient">{totalCritiques}</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
                Total Issues
              </div>
            </div>

            <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-flame)]" />
              </div>
              <div className="font-display text-2xl sm:text-4xl font-bold text-[var(--color-flame)]">{criticalCount}</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
                Critical
              </div>
            </div>

            <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              </div>
              <div className="font-display text-2xl sm:text-4xl font-bold text-green-400">{session.rebuttals.length}</div>
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
                Defenses
              </div>
            </div>
          </div>
        )}

        {/* Project summary */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2 sm:mb-3">
            Your Project Idea
          </h2>
          <p className="text-[var(--color-light)] leading-relaxed text-base sm:text-lg">{session.projectIdea}</p>

          {session.projectUrl && (
            <div className="mt-3 sm:mt-4 flex items-center gap-2 min-w-0">
              <ExternalLink className="w-4 h-4 text-[var(--color-slate)] flex-shrink-0" />
              <a
                href={session.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-[var(--color-ember)] hover:text-[var(--color-spark)] transition-colors truncate"
              >
                {session.projectUrl}
              </a>
            </div>
          )}

          {session.screenshots && session.screenshots.length > 0 && (
            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[var(--color-ash)]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-3 sm:mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Screenshots
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {session.screenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <div className="w-28 h-20 sm:w-40 sm:h-28 rounded-lg overflow-hidden border border-[var(--color-ash)] bg-[var(--color-shadow)]">
                      <img
                        src={`data:image/png;base64,${screenshot.data}`}
                        alt={screenshot.label || `Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[10px] sm:text-xs text-[var(--color-cloud)] py-1 px-1.5 sm:px-2 flex items-center gap-1">
                      {screenshot.type === "desktop" && <Monitor className="w-3 h-3" />}
                      {screenshot.type === "mobile" && <Smartphone className="w-3 h-3" />}
                      {screenshot.type === "uploaded" && <ImageIcon className="w-3 h-3" />}
                      <span className="truncate">{screenshot.label || screenshot.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Critiques by type - full details when complete, agent panels when loading */}
        {isComplete ? (
          // Full critique cards when complete
          session.critiques.map((critiqueResult) => {
            const typeInfo = critiqueTypeLabels[critiqueResult.type];
            return (
              <section
                key={critiqueResult.type}
                className="mb-6 sm:mb-10"
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
                      rebuttal={session.rebuttals.find((r) => r.critiqueId === critique.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          // Agent panels when loading
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {critiqueTypes.map((type) => {
              const result = session.critiques.find((c) => c.type === type);
              const rebuttals = session.rebuttals.filter((r) => r.critiqueType === type);

              return (
                <div key={type}>
                  <AgentPanel
                    type={type}
                    result={result}
                    rebuttals={rebuttals}
                    isActive={activeAgents.has(type)}
                    progress={progress[type]}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        {isComplete && (
          <div className="text-center py-12 border-t border-[var(--color-ash)]">
            <Link
              to="/devil"
              className="text-[var(--color-ember)] hover:text-[var(--color-spark)] transition-colors font-medium"
            >
              Start a new critique →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
