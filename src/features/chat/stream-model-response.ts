import "server-only";

import { captureAiGeneration } from "@posthog/ai";
import { streamText } from "ai";

import {
  type ChatUIMessage,
  createResponseTimer,
  type ModelResponseMetrics,
} from "@/infrastructure/model-response-metrics";
import { trackModelAnswered } from "@/infrastructure/analytics-events";
import { posthogServer } from "@/infrastructure/posthog";

import type { ChatRequest } from "./chat-request";
import {
  markModelResponseComplete,
  markModelResponseFailed,
} from "./persist-model-response";
import { openrouter } from "./openrouter";

/**
 * Streams one model's answer back to the browser.
 *
 * PostHog receives only operational AI telemetry here. Conversation input and
 * generated output are deliberately excluded so chat content is not copied
 * into the analytics system.
 */
export const streamModelResponse = (
  { modelId, turnId, messages }: ChatRequest,
  { clerkId }: { readonly clerkId: string },
): Response => {
  const timer = createResponseTimer(modelId);
  let metrics: ModelResponseMetrics | null = null;

  const result = streamText({
    model: openrouter()(modelId),
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    onChunk: ({ chunk }) => {
      if (chunk.type === "text-delta") timer.markFirstToken();
    },
    onFinish: async ({ text }) => {
      if (!metrics) {
        console.error(`[chat] ${modelId} finished with no metrics computed yet`);
        return;
      }

      await markModelResponseComplete({ turnId, modelId, text, metrics });
      trackModelAnswered({ clerkId, turnId, modelId, status: "COMPLETE" });

      await captureAiGeneration(posthogServer(), {
        distinctId: clerkId,
        provider: "openrouter",
        model: modelId,

        // Keep LLM analytics content-free. The useful telemetry for this
        // product is token usage, latency, cost, and model/provider metadata.
        input: "",
        output: [],
        privacyMode: true,

        latency:
          metrics.timeToFirstTokenMs === null
            ? undefined
            : metrics.timeToFirstTokenMs / 1000,
        usage: {
          inputTokens: metrics.inputTokens ?? undefined,
          outputTokens: metrics.outputTokens ?? undefined,
        },
        properties: { turnId },
      }).catch((error: unknown) => {
        console.error(`[chat] failed to capture ai generation for ${modelId}`, error);
      });
    },
    onError: async ({ error }) => {
      console.error(`[chat] model ${modelId} failed`, error);

      await markModelResponseFailed({ turnId, modelId }).catch((dbError: unknown) => {
        console.error(`[chat] failed to record ${modelId} as failed`, dbError);
      });

      trackModelAnswered({ clerkId, turnId, modelId, status: "FAILED" });
    },
  });

  return result.toUIMessageStreamResponse<ChatUIMessage>({
    messageMetadata: ({ part }) => {
      if (part.type !== "finish") return undefined;

      metrics = timer.read({
        inputTokens: part.totalUsage.inputTokens,
        outputTokens: part.totalUsage.outputTokens,
        totalTokens: part.totalUsage.totalTokens,
      });

      return metrics;
    },
    onError: () =>
      "This model didn't come back. You can try it again, the others aren't affected.",
  });
};
