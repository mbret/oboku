import { memo, useState } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  Alert,
  Box,
  Button,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material"
import { useSettings } from "../../settings/helpers"
import { links } from "@oboku/shared"
import { setupSecretDialogSignal } from "../../secrets/SetupSecretDialog"
import { authorizeAction } from "../../auth/AuthorizeActionDialog"
import { useSecrets } from "../../secrets/useSecrets"
import { useDecryptedSecret } from "../../secrets/useDecryptedSecret"
import { useSecret } from "../../secrets/useSecret"
import { KeyRounded } from "@mui/icons-material"
import { SecretActionDrawer } from "../../secrets/SecretActionDrawer"

const SecretListItem = memo(
  ({
    id,
    masterKey,
    onClick,
  }: { id: string; masterKey?: string; onClick: () => void }) => {
    const { data: secret } = useSecret(id)
    const { data: decryptedSecret, isPending } = useDecryptedSecret({
      id,
      masterKey,
    })
    const secretValue = !masterKey
      ? "***********"
      : isPending
        ? "Decrypting..."
        : (decryptedSecret ?? "Unable to decrypt")

    return (
      <ListItemButton onClick={onClick}>
        <ListItemIcon>
          <KeyRounded />
        </ListItemIcon>
        <ListItemText primary={secret?.name} secondary={secretValue} />
      </ListItemButton>
    )
  },
)

export const SecretsScreen = memo(() => {
  const { data: accountSettings } = useSettings()
  const { data: secrets } = useSecrets()
  const [masterKey, setMasterKey] = useState<string | undefined>(undefined)
  const hasMasterPassword = !!accountSettings?.masterEncryptionKey
  const [drawerOpenWith, setDrawerOpenWith] = useState<string | undefined>(
    undefined,
  )

  return (
    <>
      <Box display="flex" flex={1} overflow="auto" flexDirection="column">
        <TopBarNavigation title={"Secrets"} />
        <Alert severity="info" variant="standard">
          Learn more about secrets{" "}
          <Link href={links.documentationSecrets}>here</Link>
        </Alert>
        {!hasMasterPassword && (
          <Alert severity="warning">
            You need to initialize your Master Password to use secrets
          </Alert>
        )}
        <Stack px={2} maxWidth="sm" mt={2} gap={1} mb={1}>
          <Button
            disabled={!hasMasterPassword || !!masterKey}
            onClick={() => {
              authorizeAction((masterKey) => {
                setMasterKey(masterKey)
              })
            }}
          >
            {masterKey ? "Unlocked" : "Unlock"}
          </Button>
          <Button
            disabled={!hasMasterPassword || !masterKey}
            onClick={() => {
              setupSecretDialogSignal.update({
                openWith: true,
                masterKey: masterKey ?? "",
              })
            }}
            variant="contained"
          >
            Add a secret
          </Button>
        </Stack>
        <List>
          {secrets?.map((secret) => (
            <SecretListItem
              key={secret._id}
              id={secret._id}
              masterKey={masterKey}
              onClick={() => setDrawerOpenWith(secret._id)}
            />
          ))}
        </List>
      </Box>
      <SecretActionDrawer
        openWidth={drawerOpenWith}
        onClose={() => setDrawerOpenWith(undefined)}
        masterKey={masterKey}
      />
    </>
  )
})
