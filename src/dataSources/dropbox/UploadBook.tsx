/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import React, { FC, useEffect } from 'react'
import { Report } from '../../report'
import { BlockingScreen } from '../../common/BlockingBackdrop'
import { useAddBook } from '../../books/helpers'
import { DropboxFile } from './types'
import { DataSourceType } from 'oboku-shared'
import { useDataSourceHelpers } from '../helpers'
import { UNIQUE_RESOURCE_IDENTIFIER } from './constants'

export const UploadBook: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(UNIQUE_RESOURCE_IDENTIFIER)

  useEffect(() => {
    // @ts-ignore
    if (Dropbox) {
      // @ts-ignore
      Dropbox.choose && Dropbox.choose({
        multiselect: true,
        linkType: 'direct',
        cancel: function () {
          onClose()
        },
        success: async (files: DropboxFile[]) => {
          onClose()

          await Promise.all(files.map(doc => {
            return addBook({
              book: {
                title: doc.name,
              },
              link: {
                book: null,
                data: null,
                resourceId: generateResourceId(doc.id),
                type: DataSourceType.DROPBOX,
                createdAt: new Date().toISOString(),
                modifiedAt: null
              }
            }).catch(Report.error)
          }))
        },
      })
    }

  }, [onClose, generateResourceId, addBook])

  return (
    <>
      <BlockingScreen />
    </>
  )
}