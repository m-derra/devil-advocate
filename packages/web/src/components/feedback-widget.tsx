import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MessageSquarePlus, X, Send, Lightbulb, Bug, MessageCircle, Check } from "lucide-react";
import { submitFeedback } from "../lib/api";
import type { FeedbackType, FeedbackCategory } from "@devil-advocate/shared";

const feedbackTypes: { value: FeedbackType; label: string; icon: typeof Lightbulb }[] = [
  { value: "feature_request", label: "Feature", icon: Lightbulb },
  { value: "bug_report", label: "Bug", icon: Bug },
  { value: "general", label: "General", icon: MessageCircle },
];

const categories: { value: FeedbackCategory; label: string }[] = [
  { value: "ui", label: "User Interface" },
  { value: "agents", label: "Critique Quality" },
  { value: "output", label: "Report/Export" },
  { value: "performance", label: "Speed/Performance" },
  { value: "other", label: "Other" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("feature_request");
  const [category, setCategory] = useState<FeedbackCategory>("other");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        type,
        category,
        description: description.trim(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setDescription("");
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 btn btn-primary p-3 sm:p-4 rounded-full shadow-2xl glow-ember group"
          aria-label="Give feedback"
        >
          <MessageSquarePlus className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-24 sm:right-6 z-50 sm:w-[400px] card rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--color-ash)] sticky top-0 bg-[var(--color-shadow)]">
            <Dialog.Title className="font-display text-lg sm:text-xl font-semibold text-[var(--color-light)]">
              {submitted ? "Thank you!" : "Send Feedback"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="btn btn-ghost p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="p-8 sm:p-10 text-center animate-scale-in">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <p className="text-sm sm:text-base text-[var(--color-cloud)]">Your feedback has been submitted!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Type selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2 sm:mb-3">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {feedbackTypes.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setType(ft.value)}
                      className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl border transition-all ${
                        type === ft.value
                          ? "bg-[var(--color-ember)]/10 border-[var(--color-ember)] text-[var(--color-spark)]"
                          : "bg-[var(--color-abyss)] border-[var(--color-ash)] text-[var(--color-mist)] hover:border-[var(--color-slate)]"
                      }`}
                    >
                      <ft.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-[10px] sm:text-xs font-medium">{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                  className="input text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-mist)] mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={3}
                  className="input text-sm resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!description.trim() || submitting}
                className="btn btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
