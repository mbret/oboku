import type { InstanceConfig } from "./instance-config/instance-config.service.js"
import type { InstanceSettingsResponseDto } from "./admin.dto.js"

/** What the admin panel reads of the instance config: never the Google client secret. */
export const toInstanceSettings = (
  config: InstanceConfig,
): InstanceSettingsResponseDto => ({
  showDisabledPlugins: config.showDisabledPlugins,
  fileDownloadMaxSizeBytes: config.fileDownloadMaxSizeBytes,
  allowPrivateNetworkRequests: config.allowPrivateNetworkRequests,
  privateNetworkAllowedHosts: config.privateNetworkAllowedHosts,
  googleClientId: config.googleClientId,
  googleApiKey: config.googleApiKey,
  googleClientSecretConfigured: config.googleClientSecret !== undefined,
  microsoftApplicationClientId: config.microsoftApplicationClientId,
  microsoftApplicationAuthority: config.microsoftApplicationAuthority,
  opdsServersMaxPerUser: config.opdsServersMaxPerUser,
})
