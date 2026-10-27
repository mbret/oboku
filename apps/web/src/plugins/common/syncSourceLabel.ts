const getItemCountLabel = (itemsCount: number) =>
  itemsCount === 1 ? "1 item" : `${itemsCount} items`

export const getLabelWithItemCount = (label: string, itemsCount: number) =>
  itemsCount > 0 ? `${label} (${getItemCountLabel(itemsCount)})` : label

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

  // ConnectorForm accepts URLs without a scheme. `new URL` reads the host of
  // `nas.local:5005/dav` as its scheme and leaves the hostname empty.
  return (
    parseHostname(trimmedUrlValue) ??
    parseHostname(`https://${trimmedUrlValue}`)
  )
}
