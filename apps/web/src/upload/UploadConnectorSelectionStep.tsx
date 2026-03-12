import { LoginRounded } from "@mui/icons-material"
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material"
import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ConnectorSelector } from "../connectors/ConnectorSelector"
import { useConnectors } from "../connectors/useConnectors"
import { useNotifications } from "../notifications/useNofitications"
import type { SettingsConnectorType } from "@oboku/shared"

export type UploadConnectorSelectionStepProps<TAuthResult> = {
  connectorType: SettingsConnectorType
  description: string
  onAuthenticated: (result: TAuthResult) => void
  onClose: () => void
  /** Returns auth result; called when user clicks Connect/Sign in */
  authenticate: (connectorId: string) => Promise<TAuthResult>
  /** Optional: initial selected connector id (e.g. from session) */
  initialConnectorId?: string
}

const formatError = (error: unknown) =>
  error instanceof Error ? error : new Error("Unable to connect.")

export function UploadConnectorSelectionStep<TAuthResult>(
  props: UploadConnectorSelectionStepProps<TAuthResult>,
) {
  const {
    connectorType,
    description,
    onAuthenticated,
    onClose,
    authenticate,
    initialConnectorId,
  } = props

  const { notifyError } = useNotifications()
  const { data: connectors = [] } = useConnectors({ type: connectorType })
  const [selectedConnectorId, setSelectedConnectorId] = useState<
    string | undefined
  >(initialConnectorId)

  useEffect(() => {
    if (!selectedConnectorId && connectors[0]?.id) {
      setSelectedConnectorId(connectors[0].id)
    }
  }, [connectors, selectedConnectorId])

  const authenticateMutation = useMutation({
    mutationFn: authenticate,
    onSuccess: (result) => {
      onAuthenticated(result)
    },
    onError: (error) => {
      notifyError(formatError(error))
    },
  })

  return (
    <>
      <DialogContent>
        <Stack gap={2} py={2}>
          <Alert severity="info">{description}</Alert>
          <ConnectorSelector
            connectorType={connectorType}
            onNavigate={onClose}
            value={selectedConnectorId}
            onChange={(e) => setSelectedConnectorId(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedConnectorId}
          loading={authenticateMutation.isPending}
          onClick={() => {
            if (selectedConnectorId) {
              authenticateMutation.mutate(selectedConnectorId)
            }
          }}
          startIcon={<LoginRounded />}
          variant="contained"
        >
          Connect
        </Button>
      </DialogActions>
    </>
  )
}
