const regexPattern = /(\b\S+\b) (v)(\d+)(?=\s|$)/
const replacementString = "$1 vol $3"

export const renameVolumeNumber = (title: string) => {
  const result = title.replace(regexPattern, replacementString)

  return result
}

export function removeZeroDigitFromVolumeNumber(title: string) {
  // Regular expression to match "vol" followed by a space and a single digit '0'
  const regex = /\bvol 0(\d)\b/gi

  // Replace the matched pattern with "vol" followed by the same digit without the leading zero
  return title.replace(regex, (_, digit) => `vol ${digit}`)
}

export const removeArtistAndPublisher = (title: string) => {
  // Regular expression to match and remove content inside square brackets or parentheses
  const regex = /\s*(?:\[[^\]]*\]|\([^)]*\))(?=\s|$)/g

  // Replace the matched content with an empty string
  return title.replace(regex, "")
}

export const refineTitle = (title: string, level: 1 | 2 | 3) => {
  if (level === 1) {
    return renameVolumeNumber(title)
  }

  if (level === 2) {
    return removeZeroDigitFromVolumeNumber(renameVolumeNumber(title))
  }

  return removeArtistAndPublisher(
    removeZeroDigitFromVolumeNumber(renameVolumeNumber(title))
  )
}
