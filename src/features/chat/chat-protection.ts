import "server-only";

import { detectBot, tokenBucket } from "@arcjet/next";

import { arcjetClient } from "@/infrastructure/arcjet";

/**
 * Everything Arcjet checks before a prompt is allowed to reach a model.
 */
const REFILL_RATE = 15;
const INTERVAL_SECONDS = 60;
const CAPACITY = 30;

/** One model answering one prompt, the unit a turn is billed in. */
const TOKENS_PER_CALL = 1;

let cached: ReturnType<typeof createProtectedClient> | null = null;

const createProtectedClient = () =>
  arcjetClient()
    .withRule(detectBot({ mode: "LIVE", allow: [] }))
    .withRule(
      tokenBucket({
        mode: "LIVE",
        characteristics: ["userId"],
        refillRate: REFILL_RATE,
        interval: INTERVAL_SECONDS,
        capacity: CAPACITY,
      }),
    );

const protectedClient = () => (cached ??= createProtectedClient());

const secondsUntil = (resetTime: Date | undefined): number =>
  resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : INTERVAL_SECONDS;

const denial = (message: string, status: number, headers?: HeadersInit): Response =>
  Response.json({ error: message }, { status, headers });

/**
 * Runs the rules for one chat call.
 *
 * Returns `null` when the request may proceed, or the response to send back
 * when it may not. Never surfaces an Arcjet reason verbatim.
 */
export const guardChatRequest = async (
  request: Request,
  userId: string,
): Promise<Response | null> => {
  const decision = await protectedClient().protect(request, {
    userId,
    requested: TOKENS_PER_CALL,
  });

  if (decision.isErrored()) {
    console.error("[chat] arcjet could not reach a decision", decision.reason.message);

    // Fail closed. If Arcjet cannot determine whether the request is allowed,
    // never treat that error as an implicit allow and send the request to a
    // paid model without the configured protection.
    return denial(
      "Chat protection is temporarily unavailable. Please try again in a moment.",
      503,
      { "retry-after": "5" },
    );
  }

  if (!decision.isDenied()) {
    return null;
  }

  if (decision.reason.isRateLimit()) {
    const retryAfter = secondsUntil(decision.reason.resetTime);

    return denial(
      `You've sent a lot of prompts in a short time. Try again in ${retryAfter} seconds.`,
      429,
      { "retry-after": String(retryAfter) },
    );
  }

  return denial("This request was blocked. If you think that's wrong, try again.", 403);
};
