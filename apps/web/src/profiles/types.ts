export type Profile = {
  id: string
  accessToken: string
  refreshToken: string
  email: string
  nameHex: string
  dbName: string
  needsRelogin?: boolean
}
