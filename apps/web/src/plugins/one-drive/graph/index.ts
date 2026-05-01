import {
  buildDriveItemUrl,
  fetchMicrosoftGraphJson,
  getMicrosoftGraphAuthorizationHeaders,
  type GraphDriveItem,
  parseMicrosoftGraphJsonResponse,
} from "@oboku/shared"
import { map } from "rxjs"
import { fromFetch } from "rxjs/fetch"
import { ONE_DRIVE_CONSUMER_PICKER_BASE_URL } from "../constants"

const MICROSOFT_GRAPH_ME_DRIVE_URL =
  "https://graph.microsoft.com/v1.0/me/drive?$select=driveType,webUrl"
const ONE_DRIVE_ITEM_SUMMARY_FIELDS = [
  "id",
  "name",
  "parentReference",
  "file",
  "folder",
  "package",
] as const

type CurrentUserDrive = {
  driveType?: string
  webUrl?: string
}

export type OneDriveDriveItemSummary = Pick<
  GraphDriveItem,
  "id" | "name" | "file" | "folder" | "package" | "parentReference"
>

function buildSharePointPickerBaseUrl(webUrl: string) {
  const url = new URL(webUrl)
  const pathSegments = url.pathname.split("/").filter(Boolean)

  url.search = ""
  url.hash = ""

  if (pathSegments.length >= 3) {
    url.pathname = `/${pathSegments.slice(0, -1).join("/")}`
  }

  return url.toString().replace(/\/$/, "")
}

export function fetchOneDriveJson$<T>(accessToken: string, url: string) {
  return fromFetch(url, {
    headers: getMicrosoftGraphAuthorizationHeaders(accessToken),
    selector: (response) => parseMicrosoftGraphJsonResponse<T>(response),
  })
}

function buildOneDriveItemSummaryUrl(driveId: string, fileId: string) {
  const url = new URL(buildDriveItemUrl(driveId, fileId))

  url.searchParams.set("$select", ONE_DRIVE_ITEM_SUMMARY_FIELDS.join(","))

  return url.toString()
}

export async function getOneDriveItemSummary({
  accessToken,
  driveId,
  fileId,
}: {
  accessToken: string
  driveId: string
  fileId: string
}) {
  return await fetchMicrosoftGraphJson<OneDriveDriveItemSummary>(
    accessToken,
    buildOneDriveItemSummaryUrl(driveId, fileId),
  )
}

export async function getOneDrivePickerBaseUrl(accessToken: string) {
  const drive = await fetchMicrosoftGraphJson<CurrentUserDrive>(
    accessToken,
    MICROSOFT_GRAPH_ME_DRIVE_URL,
  )

  if (drive.webUrl) {
    const webUrlOrigin = new URL(drive.webUrl).origin

    if (
      drive.driveType === "personal" ||
      webUrlOrigin === "https://onedrive.live.com"
    ) {
      return ONE_DRIVE_CONSUMER_PICKER_BASE_URL
    }

    if (drive.driveType) {
      return buildSharePointPickerBaseUrl(drive.webUrl)
    }
  }

  throw new Error("OneDrive did not return a supported picker base URL.")
}

export function getOneDriveDownloadInfo$({
  accessToken,
  driveId,
  fileId,
}: {
  accessToken: string
  driveId: string
  fileId: string
}) {
  return fetchOneDriveJson$<GraphDriveItem>(
    accessToken,
    buildDriveItemUrl(driveId, fileId),
  ).pipe(
    map((item) => {
      const downloadUrl = item["@microsoft.graph.downloadUrl"]

      if (!downloadUrl) {
        throw new Error("OneDrive did not return a download URL.")
      }

      return {
        downloadUrl,
        fileName: item.name || fileId,
        mimeType: item.file?.mimeType,
        size: item.size,
      }
    }),
  )
}
