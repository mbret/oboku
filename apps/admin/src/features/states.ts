import { signal } from "reactjrx"

export const authState = signal<{
  access_token: string | null
}>({
  default: {
    access_token: null,
  },
})
