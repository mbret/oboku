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
import { microsoftAuthCallbackPath } from "../../common/authCallbackEntrypoints.shared"
import { hasMinimumValidityLeft } from "../../common/tokenValidity"

export const msalAccountSignal = signal<AccountInfo | undefined>({})

let clientPromise: Promise<PublicClientApplication> | undefined

const MULTIPLE_MICROSOFT_ACCOUNTS_ERROR =
  "Multiple Microsoft accounts were found. Please clear the OneDrive session from the plugin settings and sign in again."

function hasAmbiguousAccounts(client: PublicClientApplication) {
  return client.getAllAccounts().length > 1
}

function assertNoAmbiguousAccounts(client: PublicClientApplication) {
  if (hasAmbiguousAccounts(client)) {
    throw new Error(MULTIPLE_MICROSOFT_ACCOUNTS_ERROR)
  }
}

function syncAccountFromClient(client: PublicClientApplication) {
  const account = resolveOneDriveAccount(client)

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

export function resolveOneDriveAccount(client: PublicClientApplication) {
  return client.getAllAccounts()[0] ?? null
}

async function tryAcquireOneDriveTokenSilently({
  authority,
  client,
  forceRefresh = false,
  scopes,
}: {
  authority?: string
  client: PublicClientApplication
  forceRefresh?: boolean
  scopes: string[]
}) {
  const account = resolveOneDriveAccount(client)

  if (!account) {
    return undefined
  }

  try {
    return await client.acquireTokenSilent({
      account,
      authority,
      forceRefresh,
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

  const account = resolveOneDriveAccount(client)

  return account && isMicrosoftConsumerAccount(account)
    ? ONE_DRIVE_CONSUMER_AUTHORITY
    : undefined
}

type MicrosoftAccessTokenRequest = {
  authority?: string
  forceRefresh?: boolean
  interaction?: "allow-interactive" | "interactive-only" | "silent-only"
  minimumValidityMs?: number
  requestPopup?: () => Promise<boolean>
  scopes: string[]
}

export async function requestMicrosoftAccessToken({
  authority,
  forceRefresh = false,
  interaction = "allow-interactive",
  minimumValidityMs = 0,
  requestPopup,
  scopes,
}: MicrosoftAccessTokenRequest): Promise<AuthenticationResult> {
  const client = await getOneDriveClient()

  assertNoAmbiguousAccounts(client)

  const effectiveAuthority = resolveAuthorityForAccount(client, authority)

  try {
    if (interaction !== "interactive-only") {
      const silentResult = await tryAcquireOneDriveTokenSilently({
        authority: effectiveAuthority,
        client,
        forceRefresh,
        scopes,
      })

      if (silentResult) {
        if (
          hasMinimumValidityLeft({
            expiresAt: silentResult.expiresOn,
            minimumValidityMs,
          })
        ) {
          return silentResult
        }

        if (!forceRefresh) {
          return requestMicrosoftAccessToken({
            authority,
            forceRefresh: true,
            interaction,
            minimumValidityMs,
            requestPopup,
            scopes,
          })
        }
      }
    }

    if (interaction === "silent-only") {
      throw new CancelError()
    }

    const result = await acquireOneDriveTokenInteractive({
      account:
        interaction === "interactive-only"
          ? undefined
          : resolveOneDriveAccount(client),
      authority: effectiveAuthority,
      client,
      requestPopup,
      scopes,
    })

    if (
      !hasMinimumValidityLeft({
        expiresAt: result.expiresOn,
        minimumValidityMs,
      })
    ) {
      throw new Error(
        "OneDrive did not return an access token with enough time left.",
      )
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
    await client.clearCache()
  } catch (error) {
    Logger.error("Error clearing OneDrive session", error)
  }

  msalAccountSignal.next(undefined)
}
