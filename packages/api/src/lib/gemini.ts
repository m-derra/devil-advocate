import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY not set - Gemini calls will fail");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Gemini 2.0 Flash - fast and capable
const MODEL_NAME = "gemini-2.0-flash";

export interface ImageInput {
  data: string; // base64
  mediaType?: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

function buildParts(textContent: string, images?: ImageInput[]): Part[] {
  const parts: Part[] = [];

  // Add images first
  if (images?.length) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mediaType || "image/png",
          data: img.data,
        },
      });
    }
  }

  parts.push({ text: textContent });

  return parts;
}

export async function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  callbacks: StreamCallbacks = {},
  images?: ImageInput[]
): Promise<string> {
  let fullText = "";

  try {
    // Gemma models don't support systemInstruction, so we prepend it to the user message
    const isGemmaModel = MODEL_NAME.startsWith("gemma");

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      ...(isGemmaModel ? {} : { systemInstruction: systemPrompt }),
    });

    // For Gemma, prepend system prompt to user message
    const finalUserMessage = isGemmaModel
      ? `<instructions>\n${systemPrompt}\n</instructions>\n\n<user_request>\n${userMessage}\n</user_request>`
      : userMessage;

    const parts = buildParts(finalUserMessage, images);
    const result = await model.generateContentStream(parts);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        callbacks.onText?.(text);
      }
    }

    callbacks.onComplete?.(fullText);
    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err);
    throw err;
  }
}

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  images?: ImageInput[]
): Promise<string> {
  const isGemmaModel = MODEL_NAME.startsWith("gemma");

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...(isGemmaModel ? {} : { systemInstruction: systemPrompt }),
  });

  // For Gemma, prepend system prompt to user message
  const finalUserMessage = isGemmaModel
    ? `<instructions>\n${systemPrompt}\n</instructions>\n\n<user_request>\n${userMessage}\n</user_request>`
    : userMessage;

  const parts = buildParts(finalUserMessage, images);
  const result = await model.generateContent(parts);

  return result.response.text();
}
