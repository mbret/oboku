/**
 * The contentPassword is for user content protection. It is made to work
 * offline and therefore is not secured yet. This is not intended for
 * fully secured solution
 */
export const hashContentPassword = async (password: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const buffer = await window.crypto.subtle.digest(`SHA-256`, data)

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(buffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}
