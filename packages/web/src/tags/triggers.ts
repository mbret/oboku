import { trigger } from "reactjrx"

export const [removeTag$, removeTag] = trigger<{ id: string }>()
