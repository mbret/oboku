import { memo, type ReactNode, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
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
 * Parent provides the async test method.
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
  allowSelfSigned?: boolean
}

type ConnectionExtraParams<D extends ConnectionParams = ConnectionParams> =
  Partial<Omit<D, keyof ConnectionParams>>

type ResolvedConnectionParams<D extends ConnectionParams = ConnectionParams> =
  ConnectionParams & ConnectionExtraParams<D>

function getConnectionExtraParams<D extends ConnectionParams>(
  connectionData: ConnectionData<D>,
): ConnectionExtraParams<D> {
  const {
    url: _url,
    username: _username,
    passwordAsSecretId: _passwordAsSecretId,
    ...extra
  } = connectionData

  // TypeScript cannot infer that removing the base fields leaves only D's extra fields.
  return extra as unknown as ConnectionExtraParams<D>
}

/** Input data: url, username, secret id, + optional extra (e.g. directory). */
export type ConnectionData<D extends ConnectionParams = ConnectionParams> =
  Pick<ConnectionParams, "url" | "username"> & {
    passwordAsSecretId: string
  } & ConnectionExtraParams<D>

/** Async test connection; receives resolved credentials plus any extra fields. */
export type TestConnectionFn<D extends ConnectionParams = ConnectionParams> = (
  params: ResolvedConnectionParams<D>,
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
export function TestConnection<D extends ConnectionParams = ConnectionParams>({
  connectionData,
  connectorType,
  testConnection,
}: TestConnectionProps<D>) {
  const { masterKey, unlockMasterKey } = useUnlockMasterKey()
  const { url, username, passwordAsSecretId } = connectionData
  const extra = getConnectionExtraParams(connectionData)
  const debouncedUrl = useDebouncedValue(url, 500)
  const debouncedUsername = useDebouncedValue(username, 500)
  const { data: unlockedMasterKey } = useUnlockedMasterKey()
  const { data: secret } = useDecryptedSecret({
    id: passwordAsSecretId,
    masterKey: unlockedMasterKey,
    enabled: !!passwordAsSecretId && !!unlockedMasterKey,
  })

  const params: ResolvedConnectionParams<D> = {
    url: debouncedUrl ?? "",
    username: debouncedUsername ?? "",
    password: secret ?? "",
    ...extra,
  }
  const canTest = !!params.url && !!params.username && !!params.password
  const extraDependencyKey = JSON.stringify(extra)

  const {
    mutate,
    reset,
    status,
    data: success,
  } = useMutation({
    mutationKey: [connectorType, "test-connection"],
    mutationFn: () => testConnection(params),
    retry: false,
  })

  useEffect(
    function triggerTestConnection() {
      void connectorType
      void extraDependencyKey
      void secret
      void testConnection
      void debouncedUrl
      void debouncedUsername

      if (!canTest) {
        reset()
        return
      }

      mutate()
    },
    [
      canTest,
      connectorType,
      debouncedUrl,
      debouncedUsername,
      extraDependencyKey,
      mutate,
      reset,
      secret,
      testConnection,
    ],
  )

  const connectionStatus: ConnectionStatusQueryResult["status"] =
    !canTest || status === "idle" || status === "pending"
      ? "pending"
      : status === "error" || success === false
        ? "error"
        : "success"

  const renderUnlockAction = (): ReactNode =>
    masterKey ? undefined : (
      <Button onClick={unlockMasterKey} sx={{ alignSelf: "center" }}>
        Unlock
      </Button>
    )

  return (
    <ConnectionStatus
      status={connectionStatus}
      isFetching={status === "pending"}
      success={success}
      renderUnlockAction={renderUnlockAction}
    />
  )
}
