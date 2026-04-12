import { ObokuErrorCode, ObokuSharedError } from "../errors"

const MICROSOFT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"

export class MicrosoftGraphError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)

    Object.setPrototypeOf(this, MicrosoftGraphError.prototype)
  }
}

export function isMicrosoftGraphError(
  error: unknown,
): error is MicrosoftGraphError {
  return error instanceof MicrosoftGraphError
}

export function isGraphResource(resource: string) {
  try {
    return new URL(resource).origin === "https://graph.microsoft.com"
  } catch {
    return false
  }
}

export function buildDriveItemUrl(driveId: string, itemId: string) {
  return `${MICROSOFT_GRAPH_BASE_URL}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`
}

export type GraphDriveItem = {
  name: string
  size?: number
  file?: { mimeType?: string }
  "@microsoft.graph.downloadUrl"?: string
}

export async function parseMicrosoftGraphError(response: Response) {
  let payload: { error?: { code?: string; message?: string } } | undefined

  try {
    payload = await response.json()
  } catch {
    payload = undefined
  }

  const message =
    payload?.error?.message ||
    response.statusText ||
    "Microsoft Graph request failed."

  if (response.status === 404) {
    throw new ObokuSharedError(
      ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND,
      new MicrosoftGraphError(message, response.status),
    )
  }

  throw new MicrosoftGraphError(message, response.status)
}
