import { z } from "zod"

export const SwTask = {
  CoversCacheCleanup: "coversCacheCleanup",
} as const

export type SwTask = (typeof SwTask)[keyof typeof SwTask]

const emptyPayloadSchema = z.object({}).strict()
const runTaskPayloadSchema = z.object({
  task: z.enum(SwTask),
  profile: z.string().optional(),
})

/**
 * Single source of truth for every message exchanged between the web client
 * and the service worker. `type` is the discriminant, so parsing narrows the
 * payload automatically and dispatch can be made exhaustive.
 *
 * The `type` string values are part of the wire contract between a client and
 * a (possibly different version) service worker — do not rename them lightly.
 */
export const messageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SKIP_WAITING"), payload: emptyPayloadSchema }),
  z.object({ type: z.literal("RUN_TASK"), payload: runTaskPayloadSchema }),
])

export type AppMessage = z.infer<typeof messageSchema>
export type AppMessageType = AppMessage["type"]
export type MessageOf<T extends AppMessageType> = Extract<
  AppMessage,
  { type: T }
>

/**
 * Validate an unknown wire value against the message contract. Returns the
 * narrowed message on success, or `null` for anything malformed/unknown — so
 * every boundary rejects bad input once, centrally.
 */
export const parseMessage = (data: unknown): AppMessage | null => {
  const result = messageSchema.safeParse(data)

  return result.success ? result.data : null
}

/**
 * Typed factories — the only sanctioned way to build a message. Each returns a
 * fully-typed `{ type, payload }` so call sites cannot produce a malformed
 * message or mismatch a payload with its type.
 */
export const skipWaitingMessage = (): MessageOf<"SKIP_WAITING"> => ({
  type: "SKIP_WAITING",
  payload: {},
})

export const runTaskMessage = (
  task: SwTask,
  profile: string | undefined,
): MessageOf<"RUN_TASK"> => ({
  type: "RUN_TASK",
  payload: { task, profile },
})
