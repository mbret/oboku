/** The KOReader sync server oboku's reader syncs with. Its key never leaves the API. */
export type KoreaderSyncConnection = {
  serverUrl: string
  username: string
  /** When the user signed in to the server from oboku. */
  connectedAt: string
}

export type GetKoreaderSyncConnectionResponse = {
  /** `null` while oboku's reader is not connected to a sync server. */
  connection: KoreaderSyncConnection | null
}

export type ConnectKoreaderSyncServerRequest = {
  serverUrl: string
  username: string
  /** Sent once: the API keeps only the key sync clients derive from it. */
  password: string
}
