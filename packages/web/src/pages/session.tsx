import { useParams, useNavigate, Link } from "react-router-dom";
import { useSessionStream } from "../hooks/use-session-stream";
import { AgentPanel } from "../components/agent-panel";
import { Loader2, FileText, AlertCircle, ArrowLeft, ExternalLink, Monitor, Smartphone, ImageIcon } from "lucide-react";
import type { CritiqueType } from "@devil-advocate/shared";

const critiqueTypes: CritiqueType[] = ["technical", "business", "ux", "pitch"];

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-[var(--color-ash)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link
                to="/devil"
                className="btn btn-ghost p-2 rounded-lg flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Animated flame */}
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
                    {statusInfo.text}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-mist)] truncate">
                    {statusInfo.subtext}
                  </p>
                </div>
              </div>
            </div>

            {isComplete && (
              <button
                onClick={() => navigate(`/devil/report/${id}`)}
                className="btn btn-primary text-sm px-3 py-2 sm:px-4 sm:py-2 flex-shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">View Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {!isComplete && (
        <div className="sticky top-[57px] sm:top-[73px] z-10 bg-[var(--color-void)]">
          <div className="h-1 bg-[var(--color-shadow)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-ember)] to-[var(--color-amber)] transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
            <p className="text-xs font-mono text-[var(--color-slate)]">
              {session.critiques.length}/4 critics complete
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Project summary */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 animate-slide-up">
          <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2 sm:mb-3">
            Your Project Idea
          </h2>
          <p className="text-[var(--color-light)] leading-relaxed text-base sm:text-lg">
            {session.projectIdea}
          </p>

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

        {/* Agent panels grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {critiqueTypes.map((type, i) => {
            const result = session.critiques.find((c) => c.type === type);
            const rebuttals = session.rebuttals.filter((r) => r.critiqueType === type);

            return (
              <div
                key={type}
                className="opacity-0 animate-slide-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
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
      </main>
    </div>
  );
}
