import { Dialog, DialogTitle } from "@mui/material"
import { memo, useState } from "react"
import type { ObokuPlugin } from "../../plugins/types"
import { ConnectorSelectionStep } from "./upload/ConnectorSelectionStep"
import { UploadFileBrowseStep } from "./upload/UploadFileBrowseStep"
import { CONNECTOR } from "./constants"

export const UploadBook: ObokuPlugin<"synology-drive">["UploadBookComponent"] =
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
            connector={CONNECTOR}
            onAuthenticated={setAuthResult}
            onClose={onClose}
          />
        )}
      </Dialog>
    )
  })
