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

/**
 * @important
 *
 * Dangerous
 */
export function removeZeroDigitFromMaybeVolumeNumber(title: string) {
  const regexForOneZero = /\b 0(\d)\b/gi
  const regexForTwoZero = /\b 00(\d)\b/gi

  // Replace the matched pattern with "vol" followed by the same digit without the leading zero
  return title
    .replace(regexForOneZero, (_, digit) => ` ${digit}`)
    .replace(regexForTwoZero, (_, digit) => ` ${digit}`)
}

export const removeArtistAndPublisher = (title: string) => {
  // Regular expression to match and remove content inside square brackets or parentheses
  const regex = /\s*(?:\[[^\]]*\]|\([^)]*\))(?=\s|$)/g

  // Replace the matched content with an empty string
  return title.replace(regex, "")
}

/**
 * @important
 *
 * Dangerous
 */
export const removeMaybeArtistAndPublisher = (title: string) => {
  // Regular expression to match and remove content inside square brackets or parentheses
  // const regex = /(?<=\S\s)\([^()]*\)/g
  const regex = /(?<=\S\s)\([^()]*\)(?=\s*$)/g

  // Replace the matched content with an empty string
  return title.replace(regex, "").trim()
}

export const refineTitle = (title: string, level: 1 | 2 | 3 | 4 | 5) => {
  let refinedTitle = title

  if (level >= 1) {
    refinedTitle = renameVolumeNumber(title)
  }

  if (level >= 2) {
    refinedTitle = removeZeroDigitFromVolumeNumber(refinedTitle)
  }

  if (level >= 3) {
    refinedTitle = removeArtistAndPublisher(refinedTitle)
  }

  // dangerous level which might start destroying numbers in title
  if (level >= 4) {
    refinedTitle = removeZeroDigitFromMaybeVolumeNumber(refinedTitle)
  }

  if (level >= 5) {
    refinedTitle = removeMaybeArtistAndPublisher(refinedTitle)
  }

  return refinedTitle
}
