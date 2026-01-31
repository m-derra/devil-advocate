import Anthropic from "@anthropic-ai/sdk";
import type { ImageBlockParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";

const client = new Anthropic();

export interface ImageInput {
  data: string; // base64
  mediaType?: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
}

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

function buildMessageContent(
  textContent: string,
  images?: ImageInput[]
): (TextBlockParam | ImageBlockParam)[] {
  const content: (TextBlockParam | ImageBlockParam)[] = [];

  // Add images first so Claude "sees" them before the text prompt
  if (images?.length) {
    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType || "image/png",
          data: img.data,
        },
      });
    }
  }

  content.push({ type: "text", text: textContent });

  return content;
}

export async function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  callbacks: StreamCallbacks = {},
  images?: ImageInput[]
): Promise<string> {
  let fullText = "";

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: buildMessageContent(userMessage, images) }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const text = event.delta.text;
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
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: buildMessageContent(userMessage, images) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}
