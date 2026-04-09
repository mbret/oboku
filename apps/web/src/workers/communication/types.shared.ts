import type { AuthSession } from "../../auth/types"
import type { SharedConfig } from "../../config/types.shared"
import { z } from "zod"

type MessagePayload = Record<string, unknown> | null
type EmptyPayload = Record<string, never>

interface Message<Type extends string, Payload extends MessagePayload> {
  type: Type
  payload: Payload
}

const emptyPayloadSchema = z.object({}).strict()
const authSessionPayloadSchema: z.ZodType<AuthSession> = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  email: z.string(),
  nameHex: z.string(),
  dbName: z.string(),
})
const notifyAuthPayloadSchema = z.union([authSessionPayloadSchema, z.null()])
const configurationPayloadSchema: z.ZodType<SharedConfig> = z.object({
  API_COUCH_URI: z.string().optional(),
  API_URL: z.string().optional(),
})
const replyAskProfilePayloadSchema = z.object({
  profile: z.string().optional(),
})

export class AskAuthMessage
  implements Message<typeof AskAuthMessage.type, EmptyPayload>
{
  static readonly type = "ASK_AUTH"
  static validate(payload: unknown): payload is EmptyPayload {
    return emptyPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof AskAuthMessage.type = AskAuthMessage.type
  public readonly payload = {}
}

export class RefreshAuthMessage
  implements Message<typeof RefreshAuthMessage.type, EmptyPayload>
{
  static readonly type = "REFRESH_AUTH"
  static validate(payload: unknown): payload is EmptyPayload {
    return emptyPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof RefreshAuthMessage.type = RefreshAuthMessage.type
  public readonly payload = {}
}

export class NotifyAuthMessage
  implements Message<typeof NotifyAuthMessage.type, AuthSession | null>
{
  static readonly type = "NotifyAuthMessage"
  static validate(payload: unknown): payload is AuthSession | null {
    return notifyAuthPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof NotifyAuthMessage.type = NotifyAuthMessage.type

  constructor(public readonly payload: AuthSession | null) {}
}

export class AskConfigurationMessage
  implements Message<typeof AskConfigurationMessage.type, EmptyPayload>
{
  static readonly type = "ASK_CONFIGURATION"
  static validate(payload: unknown): payload is EmptyPayload {
    return emptyPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof AskConfigurationMessage.type =
    AskConfigurationMessage.type
  public readonly payload = {}
}

export class ConfigurationChangeMessage
  implements Message<typeof ConfigurationChangeMessage.type, SharedConfig>
{
  static readonly type = "CONFIGURATION_CHANGE"
  static validate(payload: unknown): payload is SharedConfig {
    return configurationPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof ConfigurationChangeMessage.type =
    ConfigurationChangeMessage.type
  constructor(public readonly payload: SharedConfig) {}
}

export class AskProfileMessage
  implements Message<typeof AskProfileMessage.type, EmptyPayload>
{
  static readonly type = "ASK_PROFILE"
  static validate(payload: unknown): payload is EmptyPayload {
    return emptyPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof AskProfileMessage.type = AskProfileMessage.type
  public readonly payload = {}
}

export class ReplyAskProfileMessage
  implements
    Message<typeof ReplyAskProfileMessage.type, { profile: string | undefined }>
{
  static readonly type = "ReplyAskProfileMessage"
  static validate(
    payload: unknown,
  ): payload is { profile: string | undefined } {
    return replyAskProfilePayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof ReplyAskProfileMessage.type =
    ReplyAskProfileMessage.type

  constructor(public readonly payload: { profile: string | undefined }) {}
}

/**
 * Message to skip waiting for the service worker to be updated.
 * The service worker receiving this can decide to install itself.
 */
export class SkipWaitingMessage
  implements Message<typeof SkipWaitingMessage.type, EmptyPayload>
{
  static readonly type = "SKIP_WAITING"
  static validate(payload: unknown): payload is EmptyPayload {
    return emptyPayloadSchema.safeParse(payload).success
  }

  public readonly type: typeof SkipWaitingMessage.type = SkipWaitingMessage.type
  public readonly payload = {}
}
