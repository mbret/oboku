/**
 * @see https://www.dropbox.com/developers/chooser
 * @see https://www.dropbox.com/lp/developers/reference/oauth-guide
 */
import React, { FC, useEffect, useState } from 'react'
import { Report } from '../../debug/report.shared'
import { BlockingScreen } from '../../common/BlockingBackdrop'
import { useAddBook } from '../../books/helpers'
import { DropboxFile } from './types'
import { useDataSourceHelpers } from '../helpers'
import { UNIQUE_RESOURCE_IDENTIFIER } from './constants'

export const UploadBook: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()
  const [isOpened, setIsOpened] = useState(false)
  const { generateResourceId } = useDataSourceHelpers(UNIQUE_RESOURCE_IDENTIFIER)

  useEffect(() => {
    if (isOpened) return
    
    // @ts-ignore
    if (Dropbox) {
      setIsOpened(true)
      console.log('CALLED AGAIN')
      // @ts-ignore
      Dropbox.choose && Dropbox.choose({
        multiselect: true,
        linkType: 'direct',
        cancel: function () {
          onClose()
          setIsOpened(false)
        },
        success: async (files: DropboxFile[]) => {
          onClose()
          setIsOpened(false)

          await Promise.all(files.map(doc => {
            return addBook({
              book: {
                title: doc.name,
              },
              link: {
                book: null,
                data: null,
                resourceId: generateResourceId(doc.id),
                type: `DROPBOX`,
                createdAt: new Date().toISOString(),
                modifiedAt: null
              }
            }).catch(Report.error)
          }))
        },
      })
    }

  }, [onClose, generateResourceId, addBook, isOpened])

  return (
    <>
      <BlockingScreen />
    </>
  )
}