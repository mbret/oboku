// These values match APP_PUBLIC_URL, VITE_API_URL, ADMIN_LOGIN, ADMIN_PASSWORD,
// the published ports and the API's library volume (SERVER_LIBRARY.path) in
// docker-compose.yml.
const STACK_HOSTNAME = "localhost"

export const WEB_URL = `http://${STACK_HOSTNAME}:4280`
export const API_URL = `http://${STACK_HOSTNAME}:4281`

export const ADMIN_CREDENTIALS = { login: "admin", password: "password" }

export const SERVER_LIBRARY = {
  name: "Library",
  path: "/var/lib/oboku/library",
  username: "e2e-server-reader",
  password: "library-password",
}

export function isStackUrl(url: URL) {
  return url.hostname === STACK_HOSTNAME
}
