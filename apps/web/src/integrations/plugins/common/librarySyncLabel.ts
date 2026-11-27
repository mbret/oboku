const getLocationCountLabel = (locationsCount: number) =>
  locationsCount === 1 ? "1 location" : `${locationsCount} locations`

export const getLabelWithLocationCount = (
  label: string,
  locationsCount: number,
) =>
  locationsCount > 0
    ? `${label} (${getLocationCountLabel(locationsCount)})`
    : label

export const getHostname = (urlValue: string) => {
  const trimmedUrlValue = urlValue.trim()

  return URL.canParse(trimmedUrlValue)
    ? new URL(trimmedUrlValue).hostname || undefined
    : undefined
}
