const getLocationCountLabel = (locationsCount: number) =>
  locationsCount === 1 ? "1 location" : `${locationsCount} locations`

export const getLabelWithLocationCount = (
  label: string,
  locationsCount: number,
) =>
  locationsCount > 0
    ? `${label} (${getLocationCountLabel(locationsCount)})`
    : label

const parseHostname = (urlValue: string) => {
  try {
    return new URL(urlValue).hostname || undefined
  } catch {
    return undefined
  }
}

export const getHostname = (urlValue: string) => {
  const trimmedUrlValue = urlValue.trim()

  if (!trimmedUrlValue) {
    return undefined
  }

  return parseHostname(trimmedUrlValue)
}
