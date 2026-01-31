import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllFeedback, getExportUrl, getHackathonContext, updateHackathonContext, verifyAdminCredentials } from "../lib/api";
import type { Feedback, FeedbackType, FeedbackCategory } from "@devil-advocate/shared";
import {
  Loader2,
  Download,
  Lightbulb,
  Bug,
  MessageCircle,
  Filter,
  ArrowLeft,
  Save,
  Check,
  Settings,
  Lock,
  LogOut,
} from "lucide-react";

const typeIcons: Record<FeedbackType, typeof Lightbulb> = {
  feature_request: Lightbulb,
  bug_report: Bug,
  general: MessageCircle,
};

const typeLabels: Record<FeedbackType, string> = {
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  general: "General",
};

const typeStyles: Record<FeedbackType, string> = {
  feature_request: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  bug_report: "text-[var(--color-flame)] bg-red-500/10 border-red-500/20",
  general: "text-[var(--color-mist)] bg-[var(--color-shadow)] border-[var(--color-ash)]",
};

const categoryLabels: Record<FeedbackCategory, string> = {
  ui: "UI",
  agents: "Agents",
  output: "Output",
  performance: "Performance",
  other: "Other",
};

const AUTH_KEY = "devil-advocate-admin-auth";

export function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Data state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | "all">("all");

  // Hackathon context state
  const [hackathonContext, setHackathonContext] = useState("");
  const [contextLoading, setContextLoading] = useState(true);
  const [contextSaving, setContextSaving] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    const isValid = await verifyAdminCredentials(username, password);
    if (isValid) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setIsAuthenticated(true);
    } else {
      setAuthError("Invalid credentials");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load feedback
    getAllFeedback()
      .then((data) => {
        setFeedback(data.feedback);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch feedback:", err);
        setIsLoading(false);
      });

    // Load hackathon context
    getHackathonContext()
      .then((context) => {
        setHackathonContext(context);
        setContextLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch hackathon context:", err);
        setContextLoading(false);
      });
  }, [isAuthenticated]);

  const handleSaveContext = async () => {
    setContextSaving(true);
    try {
      await updateHackathonContext(hackathonContext);
      setContextSaved(true);
      setTimeout(() => setContextSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save hackathon context:", err);
    } finally {
      setContextSaving(false);
    }
  };

  const filteredFeedback = feedback.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    total: feedback.length,
    featureRequests: feedback.filter((f) => f.type === "feature_request").length,
    bugs: feedback.filter((f) => f.type === "bug_report").length,
    general: feedback.filter((f) => f.type === "general").length,
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--color-ember)]/10 border border-[var(--color-ember)]/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[var(--color-ember)]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-light)] mb-2">
              Admin Access
            </h1>
            <p className="text-sm text-[var(--color-mist)]">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input w-full"
                autoFocus
                autoComplete="username"
                disabled={authLoading}
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input w-full"
                autoComplete="current-password"
                disabled={authLoading}
              />
            </div>

            {authError && (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-flame)]">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || authLoading}
              className="btn btn-primary w-full disabled:opacity-40"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Unlock"
              )}
            </button>

            <Link
              to="/devil"
              className="block text-center text-sm text-[var(--color-mist)] hover:text-[var(--color-cloud)] transition-colors"
            >
              Back to home
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-[var(--color-ash)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/devil" className="btn btn-ghost p-2 rounded-lg flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <defs>
                    <linearGradient id="adminFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="50%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M50 10 C30 30 20 50 25 70 C28 85 40 95 50 95 C60 95 72 85 75 70 C80 50 70 30 50 10 Z M40 60 C35 70 40 80 50 80 C60 80 65 70 60 60 C55 50 45 50 40 60 Z"
                    fill="url(#adminFlame)"
                  />
                </svg>

                <div className="min-w-0">
                  <h1 className="font-display text-lg sm:text-xl font-semibold text-[var(--color-light)] truncate">
                    Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-mist)] truncate">
                    Settings & Feedback
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={getExportUrl()}
                className="btn btn-primary text-sm px-3 py-2 sm:px-4"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">Export</span>
              </a>
              <button
                onClick={handleLogout}
                className="btn btn-ghost p-2 rounded-lg text-[var(--color-mist)] hover:text-[var(--color-light)]"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hackathon Context Section */}
        <section className="mb-6 sm:mb-10 animate-slide-up">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-amber)]" />
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--color-light)]">
              Hackathon Context
            </h2>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[var(--color-mist)] mb-3 sm:mb-4">
              This context will be used for all critique sessions. Include hackathon name, theme, judging criteria, rules, time constraints, and any other relevant information.
            </p>

            {contextLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[var(--color-ember)] animate-spin" />
              </div>
            ) : (
              <>
                <textarea
                  value={hackathonContext}
                  onChange={(e) => setHackathonContext(e.target.value)}
                  placeholder="Example:

Hackathon: ETHGlobal SF 2024
Theme: AI x Web3
Duration: 36 hours

Judging Criteria:
- Innovation (25%): How novel is the idea?
- Technical Complexity (25%): How impressive is the implementation?
- Impact (25%): Does it solve a real problem?
- Presentation (25%): Is the demo compelling?

Rules:
- Must use at least one sponsor API
- Max 4 team members
- Code must be written during the event

Sponsor Tracks:
- Best use of Anthropic API ($5k)
- Best DeFi project ($3k)"
                  rows={12}
                  className="input resize-none mb-4 font-mono text-sm"
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-slate)] font-mono">
                    {hackathonContext.length} characters
                  </p>

                  <button
                    onClick={handleSaveContext}
                    disabled={contextSaving}
                    className="btn btn-primary"
                  >
                    {contextSaved ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Saved!
                      </>
                    ) : contextSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Context
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Divider */}
        <div className="divider mb-6 sm:mb-10" />

        {/* Feedback Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center animate-slide-up stagger-1">
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-light)]">{stats.total}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Total
            </div>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center animate-slide-up stagger-2">
            <div className="font-display text-2xl sm:text-3xl font-bold text-blue-400">{stats.featureRequests}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Features
            </div>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center animate-slide-up stagger-3">
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-flame)]">{stats.bugs}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              Bugs
            </div>
          </div>

          <div className="card rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center animate-slide-up stagger-4">
            <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-mist)]">{stats.general}</div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mt-1">
              General
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-4 animate-slide-up stagger-5">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-mist)]" />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FeedbackType | "all")}
            className="input text-xs sm:text-sm w-auto flex-1 sm:flex-none min-w-0"
          >
            <option value="all">All Types</option>
            <option value="feature_request">Features</option>
            <option value="bug_report">Bugs</option>
            <option value="general">General</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FeedbackCategory | "all")}
            className="input text-xs sm:text-sm w-auto flex-1 sm:flex-none min-w-0"
          >
            <option value="all">All Categories</option>
            <option value="ui">UI</option>
            <option value="agents">Agents</option>
            <option value="output">Output</option>
            <option value="performance">Performance</option>
            <option value="other">Other</option>
          </select>

          <span className="text-xs sm:text-sm text-[var(--color-slate)] w-full sm:w-auto sm:ml-auto font-mono text-right">
            {filteredFeedback.length} results
          </span>
        </div>

        {/* Feedback list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--color-ember)] animate-spin" />
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <p className="text-sm sm:text-base text-[var(--color-slate)]">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredFeedback.map((f, i) => {
              const Icon = typeIcons[f.type];
              return (
                <div
                  key={f.id}
                  className="card rounded-xl p-3 sm:p-5 opacity-0 animate-slide-up"
                  style={{ animationDelay: `${0.6 + i * 0.05}s` }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border ${typeStyles[f.type]} flex-shrink-0`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-[var(--color-light)]">
                          {typeLabels[f.type]}
                        </span>
                        {f.category && (
                          <span className="badge text-[10px] sm:text-xs bg-[var(--color-shadow)] border-[var(--color-ash)] text-[var(--color-mist)]">
                            {categoryLabels[f.category]}
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs text-[var(--color-slate)] font-mono">
                          {new Date(f.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base text-[var(--color-cloud)] leading-relaxed">
                        {f.description}
                      </p>

                      {f.url && (
                        <p className="text-[10px] sm:text-xs text-[var(--color-slate)] mt-2 sm:mt-3 font-mono truncate">
                          From: {f.url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
