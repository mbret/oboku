import { NumberSettingSection } from "./NumberSettingSection"

const BYTES_PER_GIBIBYTE = 1024 ** 3

export function AdminQuotasSection() {
  return (
    <NumberSettingSection
      title="Quotas"
      description="Proxied downloads are files the server fetches from a provider and passes on to users, such as the books reading apps download from an OPDS server. Their quota caps what the server sends for all users together each month. Keep it below the monthly outbound traffic your host includes, with a margin for the server's other traffic."
      label="Proxied download quota per month (GiB)"
      saveLabel="save quota settings"
      minimumError="Must be at least 1 GiB"
      step={50}
      toSavedValue={function toGibibytes(settings) {
        return Math.round(
          settings.proxiedDownloadBytesMaxPerMonth / BYTES_PER_GIBIBYTE,
        )
      }}
      toSettings={function toQuotaSettings(gibibytes) {
        return {
          proxiedDownloadBytesMaxPerMonth: gibibytes * BYTES_PER_GIBIBYTE,
        }
      }}
    />
  )
}
