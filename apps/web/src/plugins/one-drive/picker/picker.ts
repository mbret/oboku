import { isGraphResource } from "@oboku/shared"
import { CancelError } from "../../../errors/errors.shared"
import { requestMicrosoftAccessToken } from "../auth/auth"
import {
  ONE_DRIVE_CONSUMER_AUTHORITY,
  PICKER_CONSUMER_SCOPES,
  ONE_DRIVE_GRAPH_SCOPES,
} from "../constants"

type PickerNotificationPayload = {
  notification?: string
}

type PickerInitializeMessage = {
  channelId?: string
  type?: string
}

type PickerCommand = {
  command?: string
  items?: OneDrivePickerItem[]
  resource?: string
}

type PickerChannelMessage =
  | { data?: PickerNotificationPayload; type?: "notification" }
  | { data?: PickerCommand; id?: string; type?: "command" }

export type OneDrivePickerItem = {
  id?: string
  name?: string
  parentReference?: {
    driveId?: string
  }
  "@sharePoint.endpoint"?: string
}

type CommandOutcome =
  | { action: "picked"; items: ReadonlyArray<OneDrivePickerItem> }
  | { action: "closed" }
  | { action: "handled" }

function isOneDriveConsumerResource(resource: string) {
  try {
    const { hostname, origin } = new URL(resource)

    return (
      origin === "https://api.onedrive.com" ||
      origin === "https://onedrive.live.com" ||
      hostname === "my.microsoftpersonalcontent.com" ||
      hostname.endsWith(".microsoftpersonalcontent.com")
    )
  } catch {
    return false
  }
}

function buildMicrosoftResourceScope(resource: string) {
  try {
    const url = new URL(resource)
    url.hash = ""
    url.search = ""

    const normalizedResource = url.toString().endsWith("/")
      ? url.toString()
      : `${url.toString()}/`

    return `${normalizedResource}.default`
  } catch {
    const normalizedResource = resource.endsWith("/")
      ? resource
      : `${resource}/`

    return `${normalizedResource}.default`
  }
}

// ---------------------------------------------------------------------------
// Message-protocol helpers
// ---------------------------------------------------------------------------

function acknowledgeCommand(port: MessagePort, messageId: string) {
  port.postMessage({ id: messageId, type: "acknowledge" })
}

function replyWithToken(port: MessagePort, messageId: string, token: string) {
  port.postMessage({
    data: { result: "token", token },
    id: messageId,
    type: "result",
  })
}

function replyWithSuccess(port: MessagePort, messageId: string) {
  port.postMessage({
    data: { result: "success" },
    id: messageId,
    type: "result",
  })
}

function replyWithError(
  port: MessagePort,
  messageId: string,
  code: string,
  message: string,
) {
  port.postMessage({
    data: {
      error: { code, message },
      result: "error",
    },
    id: messageId,
    type: "result",
  })
}

// ---------------------------------------------------------------------------
// Token acquisition
// ---------------------------------------------------------------------------

export async function requestPickerAccessTokenForResource({
  requestPopup,
  resource,
}: {
  requestPopup: (() => Promise<boolean>) | undefined
  resource: string
}) {
  if (isGraphResource(resource)) {
    return (
      await requestMicrosoftAccessToken({
        requestPopup,
        scopes: ONE_DRIVE_GRAPH_SCOPES,
      })
    ).accessToken
  }

  if (isOneDriveConsumerResource(resource)) {
    return (
      await requestMicrosoftAccessToken({
        authority: ONE_DRIVE_CONSUMER_AUTHORITY,
        requestPopup,
        scopes: PICKER_CONSUMER_SCOPES,
      })
    ).accessToken
  }

  return (
    await requestMicrosoftAccessToken({
      requestPopup,
      scopes: [buildMicrosoftResourceScope(resource)],
    })
  ).accessToken
}

function buildPickerPageUrl(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl

  return normalizedBaseUrl.endsWith("/picker")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/_layouts/15/FilePicker.aspx`
}

// ---------------------------------------------------------------------------
// Command dispatch
// ---------------------------------------------------------------------------

async function handlePickerCommand(
  port: MessagePort,
  messageId: string,
  command: PickerCommand | undefined,
): Promise<CommandOutcome> {
  switch (command?.command) {
    case "authenticate": {
      const resource = command.resource

      if (!resource) {
        replyWithError(
          port,
          messageId,
          "unableToObtainToken",
          "OneDrive did not specify an auth resource.",
        )
        return { action: "handled" }
      }

      try {
        const token = await requestPickerAccessTokenForResource({
          requestPopup: undefined,
          resource,
        })
        replyWithToken(port, messageId, token)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to handle OneDrive."
        replyWithError(port, messageId, "unableToObtainToken", message)
      }

      return { action: "handled" }
    }
    case "close": {
      replyWithSuccess(port, messageId)
      return { action: "closed" }
    }
    case "pick": {
      replyWithSuccess(port, messageId)
      const items = Array.isArray(command.items) ? command.items : []
      return { action: "picked", items }
    }
    default: {
      replyWithError(
        port,
        messageId,
        "unsupportedCommand",
        command?.command ?? "unknown",
      )
      return { action: "handled" }
    }
  }
}

// ---------------------------------------------------------------------------
// Picker URL & form submission
// ---------------------------------------------------------------------------

function buildPickerUrl({
  baseUrl,
  channelId,
  fileFilters,
  locale,
}: {
  baseUrl: string
  channelId: string
  fileFilters?: readonly string[]
  locale: string
}) {
  const query = new URLSearchParams({
    filePicker: JSON.stringify({
      sdk: "8.0",
      authentication: {},
      commands: {
        close: { label: "Cancel" },
        pick: { action: "select", label: "Add books" },
      },
      entry: { oneDrive: {} },
      messaging: { channelId, origin: window.location.origin },
      search: { enabled: true },
      selection: { mode: "multiple" },
      typesAndSources: {
        ...(fileFilters && { filters: fileFilters }),
        mode: "files",
      },
    }),
    locale,
  })

  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl

  return `${buildPickerPageUrl(normalizedBaseUrl)}?${query.toString()}`
}

function submitPickerForm({
  accessToken,
  iframeName,
  url,
}: {
  accessToken: string
  iframeName: string
  url: string
}) {
  const form = document.createElement("form")
  const tokenInput = document.createElement("input")

  form.setAttribute("action", url)
  form.setAttribute("method", "POST")
  form.setAttribute("target", iframeName)

  tokenInput.setAttribute("name", "access_token")
  tokenInput.setAttribute("type", "hidden")
  tokenInput.setAttribute("value", accessToken)

  form.append(tokenInput)
  document.body.append(form)
  form.submit()
  form.remove()
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function pickOneDriveItemsWithPicker({
  baseUrl,
  fileFilters,
  iframe,
  initialAccessToken,
  locale,
  signal,
}: {
  baseUrl: string
  fileFilters?: readonly string[]
  iframe: HTMLIFrameElement
  initialAccessToken: string
  locale: string
  signal?: AbortSignal
}) {
  const iframeName = iframe.name

  if (!iframeName) {
    throw new Error("OneDrive picker iframe is missing a name.")
  }

  const channelId = crypto.randomUUID()
  const pickerOrigin = new URL(baseUrl).origin
  const pickerUrl = buildPickerUrl({ baseUrl, channelId, fileFilters, locale })

  return await new Promise<ReadonlyArray<OneDrivePickerItem>>(
    (resolve, reject) => {
      let port: MessagePort | undefined
      let settled = false

      const cleanup = () => {
        window.removeEventListener("message", handleWindowMessage)
        signal?.removeEventListener("abort", handleAbort)

        if (port) {
          port.removeEventListener("message", handlePortMessage)
          port.close()
          port = undefined
        }
      }

      const settle = (
        result:
          | { ok: true; items: ReadonlyArray<OneDrivePickerItem> }
          | { ok: false; error: unknown },
      ) => {
        if (settled) return

        settled = true
        cleanup()

        if (result.ok) {
          resolve(result.items)
        } else {
          reject(result.error)
        }
      }

      const handleAbort = () => {
        settle({ ok: false, error: new CancelError() })
      }

      const handlePortMessage = async (
        event: MessageEvent<PickerChannelMessage>,
      ) => {
        if (!port) return

        const payload = event.data

        if (payload?.type === "notification") return
        if (payload?.type !== "command" || !payload.id) return

        acknowledgeCommand(port, payload.id)

        const outcome = await handlePickerCommand(
          port,
          payload.id,
          payload.data,
        )

        if (outcome.action === "picked") {
          settle({ ok: true, items: outcome.items })
        } else if (outcome.action === "closed") {
          settle({ ok: false, error: new CancelError() })
        }
      }

      const handleWindowMessage = (
        event: MessageEvent<PickerInitializeMessage>,
      ) => {
        if (
          event.source !== iframe.contentWindow ||
          event.origin !== pickerOrigin
        ) {
          return
        }

        const payload = event.data

        if (
          payload?.type !== "initialize" ||
          payload.channelId !== channelId ||
          !event.ports[0]
        ) {
          return
        }

        if (port) {
          port.removeEventListener("message", handlePortMessage)
          port.close()
        }

        port = event.ports[0]
        port.addEventListener("message", handlePortMessage)
        port.start()
        port.postMessage({ type: "activate" })
      }

      if (signal?.aborted) {
        settle({ ok: false, error: new CancelError() })
        return
      }

      signal?.addEventListener("abort", handleAbort, { once: true })
      window.addEventListener("message", handleWindowMessage)

      submitPickerForm({
        accessToken: initialAccessToken,
        iframeName,
        url: pickerUrl,
      })
    },
  )
}
