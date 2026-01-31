import { useEffect, useState, useCallback } from "react";
import type {
  Session,
  SessionStatus,
  CritiqueResult,
  RebuttalResult,
  CritiqueType,
} from "@devil-advocate/shared";
import { createSessionStream, getSession } from "../lib/api";

interface StreamState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  activeAgents: Set<CritiqueType>;
  progress: Record<string, string>;
}

export function useSessionStream(sessionId: string | undefined) {
  const [state, setState] = useState<StreamState>({
    session: null,
    isLoading: true,
    error: null,
    activeAgents: new Set(),
    progress: {},
  });

  const updateSession = useCallback((updates: Partial<Session>) => {
    setState((prev) => ({
      ...prev,
      session: prev.session ? { ...prev.session, ...updates } : null,
    }));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    let eventSource: EventSource | null = null;

    async function init() {
      try {
        // Fetch initial state
        const session = await getSession(sessionId!);
        setState((prev) => ({
          ...prev,
          session,
          isLoading: false,
        }));

        // If already complete, don't stream
        if (session.status === "completed" || session.status === "error") {
          return;
        }

        // Connect to SSE stream
        eventSource = createSessionStream(sessionId!);

        eventSource.addEventListener("session:status", (e) => {
          const data = JSON.parse(e.data);
          updateSession({ status: data.status as SessionStatus });
        });

        eventSource.addEventListener("critique:start", (e) => {
          const data = JSON.parse(e.data);
          setState((prev) => ({
            ...prev,
            activeAgents: new Set([...prev.activeAgents, data.type as CritiqueType]),
          }));
        });

        eventSource.addEventListener("critique:progress", (e) => {
          const data = JSON.parse(e.data);
          setState((prev) => ({
            ...prev,
            progress: {
              ...prev.progress,
              [data.type]: (prev.progress[data.type] || "") + data.text,
            },
          }));
        });

        eventSource.addEventListener("critique:complete", (e) => {
          const data = JSON.parse(e.data);
          const critique = data.critique as CritiqueResult;
          setState((prev) => {
            const newActiveAgents = new Set(prev.activeAgents);
            newActiveAgents.delete(critique.type);
            return {
              ...prev,
              activeAgents: newActiveAgents,
              session: prev.session
                ? {
                    ...prev.session,
                    critiques: [...prev.session.critiques, critique],
                  }
                : null,
            };
          });
        });

        eventSource.addEventListener("rebuttal:complete", (e) => {
          const data = JSON.parse(e.data);
          const rebuttal = data.rebuttal as RebuttalResult;
          setState((prev) => ({
            ...prev,
            session: prev.session
              ? {
                  ...prev.session,
                  rebuttals: [...prev.session.rebuttals, rebuttal],
                }
              : null,
          }));
        });

        eventSource.addEventListener("session:complete", () => {
          updateSession({ status: "completed", completedAt: new Date() });
          eventSource?.close();
        });

        eventSource.addEventListener("session:error", (e) => {
          const data = JSON.parse(e.data);
          setState((prev) => ({
            ...prev,
            error: data.error,
          }));
          eventSource?.close();
        });

        eventSource.onerror = () => {
          setState((prev) => ({
            ...prev,
            error: "Connection lost. Refreshing...",
          }));
          // Attempt to refetch session state
          getSession(sessionId!).then((session) => {
            setState((prev) => ({
              ...prev,
              session,
              error: null,
            }));
          });
        };
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load session",
        }));
      }
    }

    init();

    return () => {
      eventSource?.close();
    };
  }, [sessionId, updateSession]);

  return state;
}
