import { getMicrosoftGraphDriveItem } from "@oboku/shared"
import { Readable } from "node:stream"
import type { ReadableStream as NodeReadableStream } from "node:stream/web"

export async function getOneDriveDriveItem({
  accessToken,
  driveId,
  fileId,
}: {
  accessToken: string
  driveId: string
  fileId: string
}) {
  return await getMicrosoftGraphDriveItem({
    accessToken,
    driveId,
    itemId: fileId,
  })
}

export async function downloadOneDriveDriveItem({
  accessToken,
  driveId,
  fileId,
}: {
  accessToken: string
  driveId: string
  fileId: string
}) {
  const item = await getOneDriveDriveItem({
    accessToken,
    driveId,
    fileId,
  })

  const downloadUrl = item["@microsoft.graph.downloadUrl"]

  if (!downloadUrl) {
    throw new Error("OneDrive did not return a download URL.")
  }

  const response = await fetch(downloadUrl)

  if (!response.ok) {
    throw new Error(response.statusText || "OneDrive download failed.")
  }

  if (!response.body) {
    throw new Error("OneDrive did not return a download stream.")
  }

  return {
    item,
    // Node's Readable.fromWeb expects the `node:stream/web` stream type, while
    // fetch() exposes the DOM ReadableStream type. They are compatible here.
    stream: Readable.fromWeb(response.body as NodeReadableStream),
  }
}
