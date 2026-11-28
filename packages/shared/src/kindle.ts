const KINDLE_EMAIL_PATTERN = /^[a-z0-9._+-]+@kindle\.com$/i

const EMAIL_ADDRESS_MAX_LENGTH = 254

/**
 * Whether `value` is one Send to Kindle address: a single mailbox on
 * `kindle.com`, with nothing around it. Anything else is refused, such as a
 * list of addresses, so the value is safe as the only recipient of an email.
 */
export const isKindleEmail = (value: string) =>
  value.length <= EMAIL_ADDRESS_MAX_LENGTH && KINDLE_EMAIL_PATTERN.test(value)
