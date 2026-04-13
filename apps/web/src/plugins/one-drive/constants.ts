export const ONE_DRIVE_PLUGIN_NAME = "OneDrive"

/**
 * Fully qualified Graph scope. The bare shorthand `Files.Read` is ambiguous
 * under the `/consumers` authority and can produce an opaque token instead
 * of a JWT, which the Graph API rejects. The full URI ensures the token is
 * always issued for the `https://graph.microsoft.com` audience.
 */
export const ONE_DRIVE_GRAPH_SCOPES = ["https://graph.microsoft.com/Files.Read"]

export const ONE_DRIVE_CONSUMER_AUTHORITY =
  "https://login.microsoftonline.com/consumers"
export const ONE_DRIVE_CONSUMER_PICKER_BASE_URL =
  "https://onedrive.live.com/picker"
export const PICKER_CONSUMER_SCOPES = ["OneDrive.ReadOnly"]
