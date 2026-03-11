import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { ObokuPlugin } from "../types"
import {
  ConnectorSelectionStep,
  type WebdavAuthResult,
} from "./upload/ConnectorSelectionStep"
import { FileBrowseStep } from "./upload/FileBrowseStep"

export const UploadBook: ObokuPlugin["UploadBookComponent"] = memo(
  ({ onClose, title }) => {
    const [authResult, setAuthResult] = useState<WebdavAuthResult | undefined>(
      undefined,
    )

    return (
      <Dialog fullScreen onClose={() => onClose()} open>
        <DialogTitle>{title}</DialogTitle>
        {authResult ? (
          <FileBrowseStep
            authResult={authResult}
            onClose={onClose}
            onGoBack={() => setAuthResult(undefined)}
          />
        ) : (
          <ConnectorSelectionStep
            connectorType="webdav"
            description="Select a connector, sign in from the browser, then browse and add files directly from your WebDAV server."
            onAuthenticated={setAuthResult}
            onClose={onClose}
          />
        )}
      </Dialog>
    )
  },
)
