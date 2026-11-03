export function getFileIdLinkLabel({ fileId }: { fileId?: string }) {
  return fileId ? `ID: ${fileId}` : undefined
}

export function getFilePathLinkLabel({ filePath }: { filePath?: string }) {
  return filePath
}
