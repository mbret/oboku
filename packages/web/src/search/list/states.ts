import { signal } from "reactjrx"

export const searchListActionsToolbarSignal = signal<{
  notInterestedContents: "none" | "with" | "only"
}>({
  key: "searchListActionsToolbarSignal",
  default: {
    notInterestedContents: "none",
  },
})
