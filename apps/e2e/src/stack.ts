// These values match APP_PUBLIC_URL, VITE_API_URL, ADMIN_LOGIN, ADMIN_PASSWORD
// and the published ports in docker-compose.yml.
const STACK_HOSTNAME = "localhost"

export const WEB_URL = `http://${STACK_HOSTNAME}:4280`
export const API_URL = `http://${STACK_HOSTNAME}:4281`

export const ADMIN_CREDENTIALS = { login: "admin", password: "password" }

export function isStackUrl(url: URL) {
  return url.hostname === STACK_HOSTNAME
}
