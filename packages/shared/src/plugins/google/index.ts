export const generateGoogleDriveResourceId = (data: { fileId: string }) =>
  `drive-${data.fileId}`

export const explodeGoogleDriveResourceId = (resourceId: string) => ({
  fileId: resourceId.replace(`drive-`, ``),
})
