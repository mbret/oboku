import { memo } from "react"
import { Alert, AlertTitle } from "@mui/material"
import { useDecryptedSecret } from "../../../secrets/useDecryptedSecret"
import { useConnect } from "./useConnect"
import { useUnlockedMasterKey } from "../../../secrets/useUnlockMasterKey"
import { useDebouncedValue } from "../../../common/useDebouncedValue"

export const TestConnection = memo(
  ({
    directory = "/",
    username,
    passwordAsSecretId,
    url,
  }: {
    directory?: string
    username?: string
    passwordAsSecretId?: string
    url?: string
  }) => {
    const {
      url: debouncedUrl,
      username: debouncedUsername,
      directory: debouncedDirectory,
    } = useDebouncedValue({ url, username, directory }, 500)
    const unlockedMasterKey = useUnlockedMasterKey()
    const { data: secret } = useDecryptedSecret({
      id: passwordAsSecretId,
      masterKey: unlockedMasterKey,
      enabled: !!passwordAsSecretId && !!unlockedMasterKey,
    })
    const {
      status: testingStatus,
      isFetching,
      data: testingData,
    } = useConnect({
      data: {
        url: debouncedUrl ?? "",
        username: debouncedUsername ?? "",
        password: secret ?? "",
        directory: debouncedDirectory ?? "",
      },
      enabled: !!debouncedUrl && !!debouncedUsername && !!secret,
    })

    return (
      <Alert
        severity={
          testingStatus === "pending" || isFetching
            ? "info"
            : testingData === false
              ? "error"
              : "success"
        }
        sx={{ alignSelf: "stretch" }}
      >
        <AlertTitle>Test connection</AlertTitle>
        {isFetching
          ? "Testing connection..."
          : testingStatus === "pending"
            ? unlockedMasterKey
              ? "Waiting for valid credentials..."
              : "Please unlock your secrets first"
            : testingStatus === "success" && testingData === false
              ? `Unable to connect to ${debouncedUrl}${debouncedDirectory}@${debouncedUsername}:*****`
              : "Connection successful"}
      </Alert>
    )
  },
)
