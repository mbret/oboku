import { createSignal } from "@react-rxjs/utils"

export const [removeTag$, removeTag] = createSignal<{ id: string }>()
