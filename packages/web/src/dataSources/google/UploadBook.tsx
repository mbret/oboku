import { ComponentProps, FC } from 'react'
import { Report } from '../../report'
import { DrivePicker } from './DrivePicker'
import { BlockingScreen } from '../../common/BlockingBackdrop'
import { useAddBook } from '../../books/helpers'
import { DataSourceType } from '@oboku/shared'
import { useDataSourceHelpers } from '../helpers'
import { UNIQUE_RESOURCE_IDENTIFIER } from './constants'

export const UploadBook: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(UNIQUE_RESOURCE_IDENTIFIER)

  const onPick: ComponentProps<typeof DrivePicker>['onClose'] = async (data) => {
    if (data instanceof Error) {
      onClose()
      // type is broken and does not have loaded https://developers.google.com/picker/docs/reference#action
      // @ts-ignore
    } else if (data.action !== 'loaded') {
      onClose()
      if (data.action === 'picked') {
        const docs = data?.docs || []
        await Promise.all(docs.map(async doc => {
          return addBook({
            book: {
              title: doc.name,
            },
            link: {
              book: null,
              data: null,
              resourceId: generateResourceId(doc.id),
              type: DataSourceType.DRIVE,
              createdAt: new Date().toISOString(),
              modifiedAt: null
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