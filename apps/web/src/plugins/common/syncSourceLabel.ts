const getItemCountLabel = (itemsCount: number) =>
  itemsCount === 1 ? "1 item" : `${itemsCount} items`

export const getLabelWithItemCount = (label: string, itemsCount: number) =>
  itemsCount > 0 ? `${label} (${getItemCountLabel(itemsCount)})` : label

export const getHostname = (urlValue: string) => {
  const trimmedUrlValue = urlValue.trim()

  if (!trimmedUrlValue) {
    return undefined
  }

  try {
    return new URL(trimmedUrlValue).hostname
  } catch {
    try {
      // ConnectorForm accepts host:port values without a scheme, so label
      // rendering needs to retry with a default protocol instead of crashing.
      return new URL(`https://${trimmedUrlValue}`).hostname
    } catch {
      return undefined
    }
  }
}
