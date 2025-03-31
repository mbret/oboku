import type { SharedConfig } from "../../config/types.shared"

interface Message<Payload extends Record<string, string | undefined>> {
  type: string
  payload: Payload
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class AskAuthMessage implements Message<{}> {
  static type = "ASK_AUTH"

  public type = AskAuthMessage.type
  public payload = {}
}

export class ReplyAuthMessage
  implements Message<{ accessToken?: string; refreshToken?: string }>
{
  static type = "REPLY_AUTH"

  public type = ReplyAuthMessage.type

  constructor(
    public payload: { accessToken?: string; refreshToken?: string },
  ) {}
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class AskConfigurationMessage implements Message<{}> {
  static type = "ASK_CONFIGURATION"

  public type = AskConfigurationMessage.type
  public payload = {}
}

export class ConfigurationChangeMessage implements Message<SharedConfig> {
  static type = "CONFIGURATION_CHANGE"

  public type = ConfigurationChangeMessage.type
  constructor(public payload: SharedConfig) {}
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class AskProfileMessage implements Message<{}> {
  static type = "ASK_PROFILE"

  public type = AskProfileMessage.type
  public payload = {}
}

export class ReplyAskProfileMessage
  implements Message<{ profile: string | undefined }>
{
  static type = "ReplyAskProfileMessage"

  public type = ReplyAskProfileMessage.type

  constructor(public payload: { profile: string | undefined }) {}
}

/**
 * Message to skip waiting for the service worker to be updated.
 * The service worker receiving this can decide to install itself.
 */
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export class SkipWaitingMessage implements Message<{}> {
  static type = "SKIP_WAITING"

  public type = SkipWaitingMessage.type
  public payload = {}
}
