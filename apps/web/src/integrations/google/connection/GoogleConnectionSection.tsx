import { Typography } from "@mui/material"
import type { GoogleConnectionDto } from "@oboku/shared"
import { PageSection } from "../../../common/PageSection"
import { useConfig } from "../../../config/useConfig"
import {
  ConnectSection,
  ConnectionDetailsSection,
  ConnectionLoadErrorSection,
  DisconnectListItem,
} from "../../../connections/ConnectionSections"
import { useActiveProfileId } from "../../../profiles/active/activeProfileId"
import { useConnectGoogleAccount } from "./useConnectGoogleAccount"
import { useDisconnectGoogleAccount } from "./useDisconnectGoogleAccount"
import { useGoogleConnection } from "./useGoogleConnection"

const SECTION_TITLE = "Google account"

function ConnectGoogleAccount() {
  const activeProfileId = useActiveProfileId()
  const {
    mutate: connect,
    error,
    isPending,
  } = useConnectGoogleAccount({ meta: { suppressGlobalErrorToast: true } })

  return (
    <ConnectSection
      title={SECTION_TITLE}
      error={error}
      isPending={isPending}
      onConnect={function connectGoogleAccount() {
        connect({ profileId: activeProfileId })
      }}
    >
      <Typography>
        Connect your Google account to let oboku's server keep access to the
        Google Drive books you added, so that it can reach them without this
        browser. It reaches only the files you picked or opened with oboku,
        never the rest of your Drive.
      </Typography>
      <Typography color="text.secondary">
        While connected, oboku stops opening Google's sign-in window whenever it
        needs your Drive.
      </Typography>
    </ConnectSection>
  )
}

function ConnectedGoogleAccount({
  connection,
}: {
  connection: GoogleConnectionDto
}) {
  const activeProfileId = useActiveProfileId()
  const { mutate: disconnect } = useDisconnectGoogleAccount()

  return (
    <>
      <ConnectionDetailsSection
        title={SECTION_TITLE}
        accountName={connection.accountName}
        connectedAt={connection.connectedAt}
      />
      <PageSection title="Danger zone" tone="danger">
        <DisconnectListItem
          label="Disconnect your Google account"
          description="oboku's server forgets its access to your Drive"
          confirmation={{
            title: "Disconnect your Google account?",
            message:
              "oboku's server forgets its access to your Drive, and your books stay in your library. To connect again later, first remove oboku from the third-party apps of your Google Account.",
          }}
          onDisconnect={function disconnectGoogleAccount() {
            disconnect({ profileId: activeProfileId })
          }}
        />
      </PageSection>
    </>
  )
}

function GoogleConnection() {
  const { data, error, isPending } = useGoogleConnection()

  if (isPending) return null

  if (!data) {
    return <ConnectionLoadErrorSection title={SECTION_TITLE} error={error} />
  }

  const { connection } = data

  return connection ? (
    <ConnectedGoogleAccount connection={connection} />
  ) : (
    <ConnectGoogleAccount />
  )
}

export function GoogleConnectionSection() {
  const { data: config } = useConfig()

  if (!config?.FEATURE_GOOGLE_CONNECTION_ENABLED) return null

  return <GoogleConnection />
}
