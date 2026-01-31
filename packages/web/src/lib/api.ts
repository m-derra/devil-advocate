import type {
  CreateSessionResponse,
  SessionResponse,
  Feedback,
  CreateFeedbackInput,
  FeedbackListResponse,
} from "@devil-advocate/shared";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export interface CreateSessionInput {
  projectIdea: string;
  projectUrl?: string;
  screenshots?: string[]; // base64 images
}

export async function createSession(
  input: CreateSessionInput
): Promise<CreateSessionResponse> {
  return fetchApi<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Settings API
export async function getHackathonContext(): Promise<string> {
  const response = await fetchApi<{ context: string }>("/settings/hackathon-context");
  return response.context;
}

export async function updateHackathonContext(context: string): Promise<void> {
  await fetchApi("/settings/hackathon-context", {
    method: "PUT",
    body: JSON.stringify({ context }),
  });
}

export async function getSession(id: string): Promise<SessionResponse> {
  return fetchApi<SessionResponse>(`/sessions/${id}`);
}

export function createSessionStream(id: string): EventSource {
  const url = `${API_BASE}/api/sessions/${id}/stream`;
  return new EventSource(url);
}

export async function submitFeedback(
  input: CreateFeedbackInput
): Promise<Feedback> {
  return fetchApi<Feedback>("/feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAllFeedback(): Promise<FeedbackListResponse> {
  return fetchApi<FeedbackListResponse>("/feedback");
}

export function getExportUrl(): string {
  return `${API_BASE}/api/feedback/export`;
}

// Auth API
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  try {
    await fetchApi("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return true;
  } catch {
    return false;
  }
}
