export const DEFAULT_MICROSOFT_APPLICATION_AUTHORITY =
  "https://login.microsoftonline.com/common"

export const MICROSOFT_CONSUMER_TENANT_ID =
  "9188040d-6c67-4c5b-b112-36a304b66dad"

export function isMicrosoftConsumerAccount(
  account:
    | {
        homeAccountId: string
        tenantId: string
      }
    | null
    | undefined,
) {
  if (!account) {
    return false
  }

  return (
    account.tenantId === MICROSOFT_CONSUMER_TENANT_ID ||
    account.homeAccountId.split(".")[1] === MICROSOFT_CONSUMER_TENANT_ID
  )
}

export * from "./graph"
