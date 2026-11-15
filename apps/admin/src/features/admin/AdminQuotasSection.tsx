import { Text } from "@mantine/core"
import { formatBytes } from "@oboku/shared"
import { formatUtcDate } from "../formatDateTime"
import { useProxiedDownloadQuota } from "../useProxiedDownloadQuota"
import { InstanceSettingsSection } from "./InstanceSettingsSection"
import { NumberSettingForm } from "./NumberSettingForm"

const BYTES_PER_GIGABYTE = 1000 ** 3

function ProxiedDownloadUsageText() {
  const { data: quota, error } = useProxiedDownloadQuota()

  if (error) {
    return (
      <Text size="sm" c="red">
        Error: {error.message}
      </Text>
    )
  }

  if (!quota) return null

  return (
    <Text size="sm">
      {`Used this month: ${formatBytes(quota.usedBytes)}. The quota starts over on ${formatUtcDate(quota.resetsAt)}.`}
    </Text>
  )
}

export function AdminQuotasSection() {
  return (
    <InstanceSettingsSection
      title="Quotas"
      description="Proxied downloads are files the server fetches from a provider and passes on to users, such as the books reading apps download from an OPDS server. Their quota caps what the server sends for all users together each month. Keep it below the monthly outbound traffic your host includes, with a margin for the server's other traffic. Each user may use a share of it, which only caps them: the shares of all users can add up to more than the quota."
      renderSettings={function renderQuotaForms(settings) {
        return (
          <>
            <NumberSettingForm
              label="Proxied download quota per month (GB)"
              saveLabel="save quota settings"
              minimumError="Must be at least 1 GB"
              step={50}
              savedValue={Math.round(
                settings.proxiedDownloadBytesMaxPerMonth / BYTES_PER_GIGABYTE,
              )}
              toSettings={function toQuotaSettings(gigabytes) {
                return {
                  proxiedDownloadBytesMaxPerMonth:
                    gigabytes * BYTES_PER_GIGABYTE,
                }
              }}
            />
            <NumberSettingForm
              label="Share of the quota each user may use (%)"
              saveLabel="save quota per user"
              minimumError="Must be at least 1%"
              max={100}
              savedValue={settings.proxiedDownloadUserQuota.percent}
              toSettings={function toUserQuotaSettings(percent) {
                return {
                  proxiedDownloadUserQuota: { type: "percentage", percent },
                }
              }}
            />
          </>
        )
      }}
    >
      <ProxiedDownloadUsageText />
    </InstanceSettingsSection>
  )
}
