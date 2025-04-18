import { memo } from "react"
import { Alert, AlertTitle } from "@mui/material"
import { useDecryptedSecret } from "../../../secrets/useDecryptedSecret"
import { useConnect } from "../useConnect"
import { useConnector } from "./useConnector"
import { useUnlockedMasterKey } from "../../../secrets/useUnlockMasterKey"

export const TestConnection = memo(
  ({
    connectorId,
    directory = "/",
  }: {
    connectorId?: string
    directory?: string
  }) => {
    const unlockedMasterKey = useUnlockedMasterKey()
    const { data: connector } = useConnector(connectorId)
    const { data: secret } = useDecryptedSecret({
      id: connector?.passwordAsSecretId,
      masterKey: unlockedMasterKey,
      enabled: !!connector && !!unlockedMasterKey,
    })
    const {
      status: testingStatus,
      isFetching,
      data: testingData,
    } = useConnect({
      data: {
        url: connector?.url ?? "",
        username: connector?.username ?? "",
        password: secret ?? "",
        directory,
      },
      enabled: !!connector && !!secret,
    })

    return (
      <>
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
                ? "Unable to connect"
                : "Connection successful"}
        </Alert>
      </>
    )
  },
)
