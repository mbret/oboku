import { InstanceSettingsSection } from "./InstanceSettingsSection"
import { NumberSettingForm } from "./NumberSettingForm"

const BYTES_PER_MEGABYTE = 1024 * 1024

export function AdminDownloadsSection() {
  return (
    <InstanceSettingsSection
      title="Downloads"
      description="Maximum size of a user file (book, …) the server accepts to download from a provider — for example when downloading a book to extract its embedded metadata during a refresh. Larger files are skipped."
      renderSettings={function renderDownloadSettings(settings) {
        return (
          <NumberSettingForm
            label="Maximum file download size (MB)"
            saveLabel="save download settings"
            rangeError="Must be at least 1 MB"
            step={50}
            savedValue={Math.round(
              settings.fileDownloadMaxSizeBytes / BYTES_PER_MEGABYTE,
            )}
            toSettings={function toDownloadSettings(megabytes) {
              return {
                fileDownloadMaxSizeBytes: Math.round(
                  megabytes * BYTES_PER_MEGABYTE,
                ),
              }
            }}
          />
        )
      }}
    />
  )
}
