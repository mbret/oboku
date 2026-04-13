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

export function getMicrosoftGraphAuthorizationHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export type GraphDriveItem = {
  id?: string
  name: string
  size?: number
  lastModifiedDateTime?: string
  file?: { mimeType?: string }
  folder?: Record<string, unknown>
  package?: Record<string, unknown>
  parentReference?: {
    driveId?: string
    id?: string
  }
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

export async function parseMicrosoftGraphJsonResponse<T>(response: Response) {
  if (!response.ok) {
    await parseMicrosoftGraphError(response)
  }

  const data: T = await response.json()

  return data
}

export async function fetchMicrosoftGraphJson<T>(
  accessToken: string,
  url: string,
) {
  const response = await fetch(url, {
    headers: getMicrosoftGraphAuthorizationHeaders(accessToken),
  })

  return await parseMicrosoftGraphJsonResponse<T>(response)
}

export async function getMicrosoftGraphDriveItem({
  accessToken,
  driveId,
  itemId,
}: {
  accessToken: string
  driveId: string
  itemId: string
}) {
  return await fetchMicrosoftGraphJson<GraphDriveItem>(
    accessToken,
    buildDriveItemUrl(driveId, itemId),
  )
}
