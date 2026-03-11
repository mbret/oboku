import { memo, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@mui/material"
import { useDecryptedSecret } from "../secrets/useDecryptedSecret"
import {
  useUnlockedMasterKey,
  useUnlockMasterKey,
} from "../secrets/useUnlockMasterKey"
import { useDebouncedValue } from "../common/useDebouncedValue"
import type { SettingsConnectorType } from "@oboku/shared"
import { Alert, AlertTitle } from "@mui/material"

export type ConnectionStatusQueryResult = {
  status: "pending" | "success" | "error"
  isFetching: boolean
  /** true = success, false = connection failed, undefined = not yet resolved */
  success: boolean | undefined
}

export type ConnectionStatusProps = ConnectionStatusQueryResult & {
  renderUnlockAction?: () => ReactNode
}

const MESSAGE_TESTING = "Testing connection..."
const MESSAGE_WAITING = "Waiting for valid credentials..."
const MESSAGE_SUCCESS = "Connection successful"
const MESSAGE_ERROR = "Unable to connect"

/**
 * Shared connection test Alert. Wording is the same for all plugins.
 * Parent provides the query result (from their connection mutation/query).
 */
const ConnectionStatus = memo(
  ({
    status,
    isFetching,
    success,
    renderUnlockAction,
  }: ConnectionStatusProps) => {
    const severity =
      status === "pending" || isFetching
        ? "info"
        : success === false
          ? "error"
          : "success"

    const message = isFetching
      ? MESSAGE_TESTING
      : status === "pending"
        ? MESSAGE_WAITING
        : success === false
          ? MESSAGE_ERROR
          : MESSAGE_SUCCESS

    return (
      <Alert
        severity={severity}
        sx={{ alignSelf: "stretch" }}
        action={renderUnlockAction?.()}
      >
        <AlertTitle>Test connection</AlertTitle>
        {message}
      </Alert>
    )
  },
)

/** Resolved params passed to testConnection (url, username, password). */
export type ConnectionParams = {
  url: string
  username: string
  password: string
}

/** Input data: url, username, secret id, + optional extra (e.g. directory). */
export type ConnectionData<D extends ConnectionParams = ConnectionParams> =
  Pick<ConnectionParams, "url" | "username"> & {
    passwordAsSecretId: string
  } & Partial<Omit<D, keyof ConnectionParams>>

/** Async test connection; D is the full params type (ConnectionParams + optional extra). */
export type TestConnectionFn<D extends ConnectionParams = ConnectionParams> = (
  params: D,
) => Promise<boolean>

export type TestConnectionProps<D extends ConnectionParams = ConnectionParams> =
  {
    connectionData: ConnectionData<D>
    connectorType: SettingsConnectorType
    testConnection: TestConnectionFn<D>
  }

/**
 * Resolves credentials from connectionData, merges in any extra fields,
 * runs testConnection and renders ConnectionStatus.
 */
function TestConnectionInner<D extends ConnectionParams = ConnectionParams>({
  connectionData,
  connectorType,
  testConnection,
}: TestConnectionProps<D>) {
  const { masterKey, unlockMasterKey } = useUnlockMasterKey()
  const { url: debouncedUrl, username: debouncedUsername } = useDebouncedValue(
    { url: connectionData.url, username: connectionData.username },
    500,
  )
  const { data: unlockedMasterKey } = useUnlockedMasterKey()
  const { data: secret } = useDecryptedSecret({
    id: connectionData.passwordAsSecretId,
    masterKey: unlockedMasterKey,
    enabled: !!connectionData.passwordAsSecretId && !!unlockedMasterKey,
  })

  const {
    url: urlValue,
    username,
    passwordAsSecretId,
    ...extra
  } = connectionData
  const params = {
    url: debouncedUrl ?? "",
    username: debouncedUsername ?? "",
    password: secret ?? "",
    ...extra,
  } as unknown as D & { password: string }

  const {
    status,
    isFetching,
    data: success,
  } = useQuery({
    queryKey: [connectorType, "test-connection", params],
    queryFn: () => testConnection(params),
    enabled: !!params.url && !!params.username && !!params.password,
    retry: false,
  })

  const renderUnlockAction = (): ReactNode =>
    masterKey ? undefined : (
      <Button onClick={unlockMasterKey} sx={{ alignSelf: "center" }}>
        Unlock
      </Button>
    )

  return (
    <ConnectionStatus
      status={status}
      isFetching={isFetching}
      success={success}
      renderUnlockAction={renderUnlockAction}
    />
  )
}

export const TestConnection = memo(TestConnectionInner) as <
  D extends ConnectionParams = ConnectionParams,
>(
  props: TestConnectionProps<D>,
) => React.ReactElement | null
