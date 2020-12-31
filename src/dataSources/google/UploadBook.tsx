import React, { ComponentProps, FC } from 'react'
import { Report } from '../../report'
import { DrivePicker } from './DrivePicker'
import { BlockingScreen } from '../../common/BlockingBackdrop'
import { useAddBook } from '../../books/helpers'
import { LinkType } from 'oboku-shared'
import { generateResourceId } from './helpers'

export const UploadBook: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()

  const onPick: ComponentProps<typeof DrivePicker>['onClose'] = async (data) => {
    if (data.action !== 'loaded') {
      onClose()
      if (data.action === 'picked') {
        const docs = data?.docs || []
        await Promise.all(docs.map(doc => {
          return addBook({
            book: {
              title: doc.name,
            },
            link: {
              book: null,
              data: null,
              resourceId: generateResourceId(doc.id),
              type: LinkType.Drive,
            }
          }).catch(Report.error)
        }))
      }
    }
  }

  return (
    <>
      <BlockingScreen />
      <DrivePicker show onClose={onPick} select="file" />
    </>
  )
}