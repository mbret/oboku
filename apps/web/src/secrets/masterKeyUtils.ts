// Function to generate a strong encryption key (hidden password)
export const generateMasterKey = async () => {
  // Generate a random 256-bit key
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"],
  )

  // Export the key to raw bytes
  const rawKey = await window.crypto.subtle.exportKey("raw", key)

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...new Uint8Array(rawKey)))
}

// This encrypts our dataKey with the user's master password
export const encryptMasterKey = async (
  dataKey: string,
  masterPassword: string,
) => {
  const encoder = new TextEncoder()

  // Derive an encryption key from the master password
  const masterKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )

  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  )

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    encoder.encode(dataKey),
  )

  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
  }
}

// Function to decrypt the hidden password with the master password
export const decryptMasterKey = async (
  encryptedData: { salt: string; iv: string; data: string },
  masterPassword: string,
) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  // Convert base64 strings back to Uint8Arrays
  const salt = Uint8Array.from(atob(encryptedData.salt), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0))
  const data = Uint8Array.from(atob(encryptedData.data), (c) => c.charCodeAt(0))

  // Derive the master key
  const masterKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )

  // Derive the AES key
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    masterKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  )

  // Decrypt the data
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    data,
  )

  return decoder.decode(decryptedData)
}
