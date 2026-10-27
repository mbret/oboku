import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { UploadBookComponentProps } from "../../../plugins/types"
import type { WebdavBackedType } from "./constants"
import {
  ConnectorSelectionStep,
  type WebdavAuthResult,
} from "./upload/ConnectorSelectionStep"
import {
  FileBrowseStep,
  type WebdavUploadBookToAddPayload,
} from "./upload/FileBrowseStep"

type WebdavUploadBookProps<T extends WebdavBackedType> = {
  connectorType: T
  headerSubtitle?: string
  maxConnectors?: number
  onClose: (booksToAdd?: ReadonlyArray<WebdavUploadBookToAddPayload<T>>) => void
  title: string
  /** Connects to this URL instead of the connector's. */
  webdavUrl?: string
}

export function WebdavUploadBook<T extends WebdavBackedType>({
  connectorType,
  headerSubtitle,
  maxConnectors,
  onClose,
  title,
  webdavUrl,
}: WebdavUploadBookProps<T>) {
  const [authResult, setAuthResult] = useState<WebdavAuthResult | undefined>(
    undefined,
  )

  const closeWithoutBooks = () => {
    onClose()
  }

  const goBackToConnectorSelection = () => {
    setAuthResult(undefined)
  }

  return (
    <Dialog fullScreen onClose={closeWithoutBooks} open>
      <DialogTitle>{title}</DialogTitle>
      {authResult ? (
        <FileBrowseStep
          authResult={authResult}
          connectorType={connectorType}
          headerSubtitle={headerSubtitle}
          onCancel={closeWithoutBooks}
          onClose={onClose}
          onGoBack={goBackToConnectorSelection}
        />
      ) : (
        <ConnectorSelectionStep
          connectorType={connectorType}
          maxConnectors={maxConnectors}
          onAuthenticated={setAuthResult}
          onClose={closeWithoutBooks}
          webdavUrl={webdavUrl}
        />
      )}
    </Dialog>
  )
}

export const UploadBook = memo(function UploadBook(
  props: UploadBookComponentProps<"webdav">,
) {
  return <WebdavUploadBook {...props} connectorType="webdav" />
})
