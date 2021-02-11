import React, { FC } from 'react'
import { useDataSourcePlugins } from '../dataSources/helpers'

export const UploadBookFromDataSource: FC<{
  openWith: ReturnType<typeof useDataSourcePlugins>[number] | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {

  if (!openWith) return null

  return (
    <openWith.UploadComponent onClose={onClose} />
  )
}