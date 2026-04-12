import type { AccountInfo, PublicClientApplication } from "@azure/msal-browser"
import { CancelError } from "../../../errors/errors.shared"
import { resolveActiveAccount } from "./auth"
import { lock, unlock } from "../../../common/locks/utils"

export async function acquireOneDriveTokenInteractive({
  account,
  authority,
  client,
  requestPopup = () => Promise.resolve(true),
  scopes,
}: {
  account?: AccountInfo | null
  authority?: string
  client: PublicClientApplication
  requestPopup: (() => Promise<boolean>) | undefined
  scopes: string[]
}) {
  const confirmed = await requestPopup()

  if (!confirmed) {
    throw new CancelError()
  }

  if (account) {
    return await client.acquireTokenPopup({
      account,
      authority,
      scopes,
    })
  }

  const lockId = crypto.randomUUID()

  try {
    lock(lockId)

    const loginResult = await client.loginPopup({
      authority,
      prompt: "select_account",
      scopes,
    })

    unlock(lockId)

    const nextAccount = loginResult.account ?? resolveActiveAccount(client)

    if (!nextAccount) {
      throw new Error("OneDrive did not return an account.")
    }

    client.setActiveAccount(nextAccount)

    if (loginResult.accessToken) {
      return loginResult
    }

    return await client.acquireTokenSilent({
      account: nextAccount,
      authority,
      scopes,
    })
  } finally {
    unlock(lockId)
  }
}
