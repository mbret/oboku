import {
  type AccountInfo,
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  EventType,
  InteractionRequiredAuthError,
  PublicClientApplication,
  type AuthenticationResult,
} from "@azure/msal-browser"
import { isMicrosoftConsumerAccount } from "@oboku/shared"
import { signal } from "reactjrx"
import { configuration } from "../../../config/configuration"
import { ONE_DRIVE_CONSUMER_AUTHORITY } from "../constants"
import { CancelError } from "../../../errors/errors.shared"
import { acquireOneDriveTokenInteractive } from "./acquireOneDriveTokenInteractive"
import { Logger } from "../../../debug/logger.shared"
import { microsoftAuthCallbackPath } from "../../authCallbackEntrypoints.shared"

export const msalAccountSignal = signal<AccountInfo | undefined>({})

let clientPromise: Promise<PublicClientApplication> | undefined

function syncAccountFromClient(client: PublicClientApplication) {
  const account = resolveActiveAccount(client)
  msalAccountSignal.next(account ?? undefined)
}

async function initializeOneDriveClient() {
  const clientId = configuration.MICROSOFT_APPLICATION_CLIENT_ID

  if (!clientId) {
    throw new Error(
      "OneDrive is not configured. Register the application client ID in admin first.",
    )
  }

  const redirectUri = new URL(
    microsoftAuthCallbackPath,
    window.location.origin,
  ).toString()

  const client = new PublicClientApplication({
    auth: {
      authority: configuration.MICROSOFT_APPLICATION_AUTHORITY,
      clientId,
      redirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  })

  await client.initialize()
  await client.handleRedirectPromise()

  client.addEventCallback(
    () => syncAccountFromClient(client),
    [
      EventType.LOGIN_SUCCESS,
      EventType.ACQUIRE_TOKEN_SUCCESS,
      EventType.LOGOUT_SUCCESS,
      EventType.ACTIVE_ACCOUNT_CHANGED,
    ],
  )

  syncAccountFromClient(client)

  return client
}

async function getOneDriveClient() {
  if (clientPromise) {
    return clientPromise
  }

  clientPromise = initializeOneDriveClient().catch((error: unknown) => {
    clientPromise = undefined

    throw error
  })

  return clientPromise
}

export function resolveActiveAccount(client: PublicClientApplication) {
  const activeAccount = client.getActiveAccount()

  if (activeAccount) {
    return activeAccount
  }

  const allAccounts = client.getAllAccounts()

  // Only auto-select when exactly one cached account (unambiguous).
  // With multiple accounts and no active selection we return null so callers
  // can surface an explicit error instead of silently binding to an arbitrary
  // identity.
  const singleAccount = allAccounts.length === 1 ? allAccounts[0] : undefined

  if (singleAccount) {
    client.setActiveAccount(singleAccount)
  }

  return singleAccount ?? null
}

async function tryAcquireOneDriveTokenSilently({
  authority,
  client,
  scopes,
}: {
  authority?: string
  client: PublicClientApplication
  scopes: string[]
}) {
  const account = resolveActiveAccount(client)

  if (!account) {
    return undefined
  }

  try {
    return await client.acquireTokenSilent({
      account,
      authority,
      scopes,
    })
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      return undefined
    }

    throw error
  }
}

function isOneDrivePopupCancelledError(error: unknown) {
  if (!error || typeof error !== "object" || !("errorCode" in error)) {
    return false
  }

  const { errorCode } = error

  return (
    errorCode === BrowserAuthErrorCodes.interactionInProgressCancelled ||
    errorCode === BrowserAuthErrorCodes.userCancelled
  )
}

function resolveAuthorityForAccount(
  client: PublicClientApplication,
  explicitAuthority: string | undefined,
) {
  if (explicitAuthority) return explicitAuthority

  const account = resolveActiveAccount(client)

  return account && isMicrosoftConsumerAccount(account)
    ? ONE_DRIVE_CONSUMER_AUTHORITY
    : undefined
}

export async function requestMicrosoftAccessToken({
  authority,
  requestPopup,
  scopes,
  skipSilent = false,
}: {
  authority?: string
  requestPopup: (() => Promise<boolean>) | undefined
  scopes: string[]
  skipSilent?: boolean
}): Promise<AuthenticationResult> {
  const client = await getOneDriveClient()
  const effectiveAuthority = resolveAuthorityForAccount(client, authority)

  try {
    if (!skipSilent) {
      const silentResult = await tryAcquireOneDriveTokenSilently({
        authority: effectiveAuthority,
        client,
        scopes,
      })

      if (silentResult) {
        client.setActiveAccount(silentResult.account)
        return silentResult
      }

      if (!client.getActiveAccount() && client.getAllAccounts().length > 1) {
        throw new Error(
          "Multiple Microsoft accounts were found. Please clear the OneDrive session from the plugin settings and sign in again.",
        )
      }
    }

    const result = await acquireOneDriveTokenInteractive({
      account: skipSilent ? undefined : resolveActiveAccount(client),
      authority: effectiveAuthority,
      client,
      requestPopup,
      scopes,
    })

    if (result.account) {
      client.setActiveAccount(result.account)
    }

    return result
  } catch (error) {
    if (isOneDrivePopupCancelledError(error)) {
      throw new CancelError()
    }

    throw error
  }
}

export async function initializeOneDriveSession() {
  if (!configuration.FEATURE_ONE_DRIVE_ENABLED) {
    return
  }

  try {
    await getOneDriveClient()
  } catch (error) {
    Logger.error(error)
  }
}

export async function clearOneDriveSession() {
  const pending = clientPromise
  clientPromise = undefined

  if (!configuration.MICROSOFT_APPLICATION_CLIENT_ID || !pending) {
    msalAccountSignal.next(undefined)
    return
  }

  try {
    const client = await pending
    client.setActiveAccount(null)
    await client.clearCache()
  } catch (error) {
    Logger.error("Error clearing OneDrive session", error)
  }

  msalAccountSignal.next(undefined)
}
