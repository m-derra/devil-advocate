import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Link as LinkIcon, ImagePlus, X } from "lucide-react";
import { createSession } from "../lib/api";

export function HomePage() {
  const navigate = useNavigate();
  const [projectIdea, setProjectIdea] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (screenshots.length >= 4) return; // Limit to 4 screenshots

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // Remove data:image/...;base64, prefix
        setScreenshots((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectIdea.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { sessionId } = await createSession({
        projectIdea: projectIdea.trim(),
        projectUrl: projectUrl.trim() || undefined,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });
      navigate(`/devil/session/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Radial gradient from top */}
        <div className="absolute inset-0 bg-gradient-ember" />

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-red-950/20 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-950/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-2xl">
          {/* Logo/Brand */}
          <div className="text-center mb-8 sm:mb-12 animate-slide-up">
            {/* Devil Icon */}
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="absolute inset-0 blur-2xl bg-red-500/30 rounded-full animate-pulse-glow" />
              <svg
                viewBox="0 0 100 100"
                className="relative w-16 h-16 sm:w-24 sm:h-24 animate-flame"
              >
                <defs>
                  <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#991b1b" />
                    <stop offset="50%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 10 C30 30 20 50 25 70 C28 85 40 95 50 95 C60 95 72 85 75 70 C80 50 70 30 50 10 Z M40 60 C35 70 40 80 50 80 C60 80 65 70 60 60 C55 50 45 50 40 60 Z"
                  fill="url(#flameGradient)"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-3 sm:mb-4">
              <span className="text-gradient">Devil's</span>
              <br />
              <span className="text-[var(--color-light)]">Advocate</span>
            </h1>

            {/* Tagline */}
            <p className="font-body text-base sm:text-xl text-[var(--color-cloud)] max-w-md mx-auto leading-relaxed px-2">
              Get your hackathon project <span className="text-[var(--color-spark)]">ruthlessly critiqued</span> before the judges do.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 animate-slide-up stagger-2">
            {/* Main textarea */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/20 to-amber-600/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <textarea
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Describe your hackathon project in vivid detail. What problem are you solving? How does it work? Who is it for?"
                rows={5}
                className="input input-textarea relative w-full rounded-xl text-base sm:text-lg"
                disabled={isSubmitting}
              />
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 font-mono text-xs text-[var(--color-slate)]">
                {projectIdea.length} chars
              </div>
            </div>

            {/* URL Input */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <LinkIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-slate)] pointer-events-none" />
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://your-app.vercel.app (optional)"
                  className="input w-full rounded-xl text-sm sm:text-base"
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--color-slate)] pl-1 hidden sm:block">
                Add your live URL and we'll capture desktop + mobile screenshots for visual critique
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || screenshots.length >= 4}
                  className="btn btn-ghost text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-lg border border-dashed border-[var(--color-ash)] hover:border-[var(--color-slate)] disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Upload Screenshots</span>
                </button>
                <span className="text-xs text-[var(--color-slate)]">
                  {screenshots.length}/4 images
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Screenshot previews */}
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {screenshots.map((screenshot, index) => (
                    <div
                      key={index}
                      className="relative group/thumb w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-[var(--color-ash)]"
                    >
                      <img
                        src={`data:image/png;base64,${screenshot}`}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-950/30 border border-red-900/50 text-[var(--color-spark)] text-sm animate-scale-in">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={projectIdea.trim().length < 10 || isSubmitting}
              className="btn btn-primary w-full py-4 sm:py-5 text-base sm:text-lg font-semibold rounded-xl group disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Summoning the critics...</span>
                </>
              ) : (
                <>
                  <span>Face the Critics</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Feature badges */}
          <div className="mt-10 sm:mt-16 flex flex-wrap justify-center gap-2 sm:gap-3 animate-slide-up stagger-3">
            {[
              { icon: "🔧", label: "Technical" },
              { icon: "💼", label: "Business" },
              { icon: "🎨", label: "UX" },
              { icon: "🎤", label: "Pitch" },
            ].map((feature, i) => (
              <div
                key={feature.label}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--color-shadow)] border border-[var(--color-ash)] text-xs sm:text-sm text-[var(--color-cloud)] opacity-0 animate-slide-up"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <span>{feature.icon}</span>
                <span className="font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Subtle footer */}
          <p className="mt-8 sm:mt-12 text-center text-xs text-[var(--color-slate)] animate-fade-in px-4" style={{ animationDelay: '0.8s' }}>
            Four AI critics analyze your project in parallel, then prepare your defenses.
          </p>
        </div>
      </div>
    </div>
  );
}
