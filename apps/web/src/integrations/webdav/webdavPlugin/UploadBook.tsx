import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type {
  ConnectorDetails,
  UploadBookComponentProps,
} from "../../plugins/types"
import { CONNECTOR, type WebdavBackedType } from "./constants"
import {
  ConnectorSelectionStep,
  type WebdavAuthResult,
} from "./upload/ConnectorSelectionStep"
import {
  FileBrowseStep,
  type WebdavUploadBookToAddPayload,
} from "./upload/FileBrowseStep"

type WebdavUploadBookProps<T extends WebdavBackedType> = {
  connector: ConnectorDetails<T>
  headerSubtitle?: string
  maxConnectors?: number
  onClose: (booksToAdd?: ReadonlyArray<WebdavUploadBookToAddPayload<T>>) => void
  title: string
  /** Connects to this URL instead of the connector's. */
  webdavUrl?: string
}

export function WebdavUploadBook<T extends WebdavBackedType>({
  connector,
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
          connectorType={connector.type}
          headerSubtitle={headerSubtitle}
          onCancel={closeWithoutBooks}
          onClose={onClose}
          onGoBack={goBackToConnectorSelection}
        />
      ) : (
        <ConnectorSelectionStep
          connector={connector}
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
  return <WebdavUploadBook {...props} connector={CONNECTOR} />
})
