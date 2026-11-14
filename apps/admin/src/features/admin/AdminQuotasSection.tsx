import { Text } from "@mantine/core"
import { formatBytes } from "@oboku/shared"
import { formatUtcDate } from "../formatDateTime"
import { useProxiedDownloadQuota } from "../useProxiedDownloadQuota"
import { NumberSettingSection } from "./NumberSettingSection"

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
    <NumberSettingSection
      title="Quotas"
      description="Proxied downloads are files the server fetches from a provider and passes on to users, such as the books reading apps download from an OPDS server. Their quota caps what the server sends for all users together each month. Keep it below the monthly outbound traffic your host includes, with a margin for the server's other traffic."
      label="Proxied download quota per month (GB)"
      saveLabel="save quota settings"
      minimumError="Must be at least 1 GB"
      step={50}
      toSavedValue={function toGigabytes(settings) {
        return Math.round(
          settings.proxiedDownloadBytesMaxPerMonth / BYTES_PER_GIGABYTE,
        )
      }}
      toSettings={function toQuotaSettings(gigabytes) {
        return {
          proxiedDownloadBytesMaxPerMonth: gigabytes * BYTES_PER_GIGABYTE,
        }
      }}
    >
      <ProxiedDownloadUsageText />
    </NumberSettingSection>
  )
}
