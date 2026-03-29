import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { ObokuPlugin } from "../types"
import {
  ConnectorSelectionStep,
  type ServerAuthResult,
} from "./upload/ConnectorSelectionStep"
import { FileBrowseStep } from "./upload/FileBrowseStep"

export const UploadBook: ObokuPlugin<"server">["UploadBookComponent"] = memo(
  ({ onClose, title }) => {
    const [authResult, setAuthResult] = useState<ServerAuthResult | undefined>(
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
            connectorType="server"
            onAuthenticated={setAuthResult}
            onClose={onClose}
          />
        )}
      </Dialog>
    )
  },
)
