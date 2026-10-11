import { createHash, randomInt, timingSafeEqual } from "node:crypto"

// Lowercase without look-alikes (i, l, o, 0, 1): the password is typed on an
// e-reader's keyboard.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
const PASSWORD_GROUP_COUNT = 4
const PASSWORD_GROUP_LENGTH = 4

const generatePasswordGroup = () =>
  Array.from(
    { length: PASSWORD_GROUP_LENGTH },
    () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
  ).join("")

/** Such as `k7mq-x2fp-9dwa-hc4n`: 16 characters from 31, about 79 bits. */
export const generateSyncPassword = () =>
  Array.from({ length: PASSWORD_GROUP_COUNT }, generatePasswordGroup).join("-")

/** The `x-auth-key` a KOReader sync client sends for a password. */
export const toSyncKey = (password: string) =>
  createHash("md5").update(password).digest("hex")

export const hashSyncKey = (key: string) =>
  createHash("sha256").update(key).digest("hex")

export const isSyncKeyMatchingHash = (key: string, keyHash: string) =>
  timingSafeEqual(
    Buffer.from(hashSyncKey(key), "hex"),
    Buffer.from(keyHash, "hex"),
  )
