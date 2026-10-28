type AuthCallbackEntrypoint = {
  htmlFile: string
  name: string
  pathname: string
}

export const dropboxAuthCallbackPath = "/auth-callback-dropbox"
export const microsoftAuthCallbackPath = "/auth-callback-microsoft"

export const authCallbackEntrypoints: ReadonlyArray<AuthCallbackEntrypoint> = [
  {
    name: "auth-callback-dropbox",
    pathname: dropboxAuthCallbackPath,
    htmlFile: "auth-callback-dropbox.html",
  },
  {
    name: "auth-callback-microsoft",
    pathname: microsoftAuthCallbackPath,
    htmlFile: "auth-callback-microsoft.html",
  },
]

export function getAuthCallbackRollupInput(): Record<string, string> {
  return Object.fromEntries(
    authCallbackEntrypoints.map(({ name, htmlFile }) => [name, htmlFile]),
  )
}
