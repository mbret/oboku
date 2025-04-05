// Function to encrypt user secrets with the hidden password
export const encryptSecret = async (
  secret: string,
  base64MasterKey: string,
) => {
  const encoder = new TextEncoder()

  // Import the hidden password as an AES key
  const keyData = Uint8Array.from(atob(base64MasterKey), (c) => c.charCodeAt(0))
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  )

  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the secret
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(secret),
  )

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
  }
}

// Function to decrypt user secrets with the hidden password
export const decryptSecret = async (
  encryptedSecret: { iv: string; data: string },
  base64MasterKey: string,
) => {
  const decoder = new TextDecoder()

  // Convert base64 strings back to Uint8Arrays
  const iv = Uint8Array.from(atob(encryptedSecret.iv), (c) => c.charCodeAt(0))
  const data = Uint8Array.from(atob(encryptedSecret.data), (c) =>
    c.charCodeAt(0),
  )

  // Import the hidden password as an AES key
  const keyData = Uint8Array.from(atob(base64MasterKey), (c) => c.charCodeAt(0))
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  )

  // Decrypt the secret
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    data,
  )

  return decoder.decode(decryptedData)
}
