export const PLUGIN_SYNOLOGY_DRIVE_TYPE = "synology-drive"
export const UNIQUE_RESOURCE_IDENTIFIER = PLUGIN_SYNOLOGY_DRIVE_TYPE

export type SynologyDriveLinkData = {
  connectorId?: string
}

export const generateSynologyDriveResourceId = (data: { fileId: string }) => {
  return data.fileId
}

export const explodeSynologyDriveResourceId = (resourceId: string) => {
  if (resourceId.startsWith("synology-drive://")) {
    const encodedFileId = resourceId.substring("synology-drive://".length)
    return { fileId: decodeURIComponent(encodedFileId) }
  }
  return { fileId: resourceId }
}

export const extractSynologyDriveFileIdFromResourceId = (resourceId: string) =>
  explodeSynologyDriveResourceId(resourceId).fileId
