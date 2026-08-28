import { readInjectedEnv } from "@oboku/shared"

export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    readInjectedEnv("__VITE_API_URL__") ||
    `${window.location.protocol}//${window.location.hostname}:3000`,
}
