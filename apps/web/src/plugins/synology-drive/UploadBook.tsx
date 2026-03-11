import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { ObokuPlugin } from "../types"
import { ConnectorSelectionStep } from "./upload/ConnectorSelectionStep"
import { FileBrowseStep } from "./upload/FileBrowseStep"

export const UploadBook: ObokuPlugin["UploadBookComponent"] = memo(
  ({ onClose, title }) => {
    const [authResult, setAuthResult] = useState<
      import("./upload/ConnectorSelectionStep").SynologyAuthResult | undefined
    >(undefined)

    return (
      <Dialog fullScreen onClose={() => onClose()} open>
        <DialogTitle>{title}</DialogTitle>
        {authResult ? (
          <FileBrowseStep
            authResult={authResult}
            onAccountChange={() => setAuthResult(undefined)}
            onClose={onClose}
          />
        ) : (
          <ConnectorSelectionStep
            connectorType="synology-drive"
            description="Select a connector, sign in from the browser, then browse your Synology Drive tree directly on your NAS."
            onAuthenticated={setAuthResult}
            onClose={onClose}
          />
        )}
      </Dialog>
    )
  },
)
