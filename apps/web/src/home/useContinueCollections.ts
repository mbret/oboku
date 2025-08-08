import { useCollections } from "../collections/useCollections"

export const useContinueCollections = () => {
  const data = useCollections({
    isNotInterested: "none",
    readingState: "ongoing",
  })

  return data
}
