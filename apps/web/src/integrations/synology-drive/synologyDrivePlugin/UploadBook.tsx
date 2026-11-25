import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { SourcePlugin } from "../../plugins/types"
import { ConnectorSelectionStep } from "./upload/ConnectorSelectionStep"
import { UploadFileBrowseStep } from "./upload/UploadFileBrowseStep"

export const UploadBook: SourcePlugin<"synology-drive">["UploadBookComponent"] =
  memo(function UploadBook({ onClose, title }) {
    const [authResult, setAuthResult] = useState<
      import("./upload/ConnectorSelectionStep").SynologyAuthResult | undefined
    >(undefined)

    return (
      <Dialog fullScreen onClose={() => onClose()} open>
        <DialogTitle>{title}</DialogTitle>
        {authResult ? (
          <UploadFileBrowseStep
            authResult={authResult}
            onAccountChange={() => setAuthResult(undefined)}
            onClose={onClose}
          />
        ) : (
          <ConnectorSelectionStep
            connectorType="synology-drive"
            onAuthenticated={setAuthResult}
            onClose={onClose}
          />
        )}
      </Dialog>
    )
  })
