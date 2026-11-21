// These values match docker-compose.yml.
const STACK_HOSTNAME = "localhost"

export const WEB_URL = `http://${STACK_HOSTNAME}:4280`
export const API_URL = `http://${STACK_HOSTNAME}:4281`

export const ADMIN_CREDENTIALS = { login: "admin", password: "password" }

export const isStackUrl = (url: URL) => url.hostname === STACK_HOSTNAME
