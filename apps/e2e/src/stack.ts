// These values match APP_PUBLIC_URL, VITE_API_URL, ADMIN_LOGIN, ADMIN_PASSWORD,
// the published ports and the API's library volume in docker-compose.yml.
const STACK_HOSTNAME = "localhost"

export const WEB_URL = `http://${STACK_HOSTNAME}:4280`
export const API_URL = `http://${STACK_HOSTNAME}:4281`

export const ADMIN_CREDENTIALS = { login: "admin", password: "password" }

export const SERVER_LIBRARY = {
  name: "Library",
  path: "/var/lib/oboku/library",
  username: "library",
  password: "library-password",
}

export type ServerLibrary = typeof SERVER_LIBRARY

export function isStackUrl(url: URL) {
  return url.hostname === STACK_HOSTNAME
}
