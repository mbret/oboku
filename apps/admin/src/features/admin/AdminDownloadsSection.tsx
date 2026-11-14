import { NumberSettingSection } from "./NumberSettingSection"

const BYTES_PER_MEGABYTE = 1024 * 1024

export function AdminDownloadsSection() {
  return (
    <NumberSettingSection
      title="Downloads"
      description="Maximum size of a user file (book, …) the server accepts to download from a provider — for example when downloading a book to extract its embedded metadata during a refresh. Larger files are skipped."
      label="Maximum file download size (MB)"
      saveLabel="save download settings"
      minimumError="Must be at least 1 MB"
      step={50}
      toSavedValue={function toMegabytes(settings) {
        return Math.round(
          settings.fileDownloadMaxSizeBytes / BYTES_PER_MEGABYTE,
        )
      }}
      toSettings={function toDownloadSettings(megabytes) {
        return {
          fileDownloadMaxSizeBytes: Math.round(megabytes * BYTES_PER_MEGABYTE),
        }
      }}
    />
  )
}
