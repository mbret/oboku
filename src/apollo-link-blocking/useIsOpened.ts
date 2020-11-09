import { useQuery } from "@apollo/client"
import { QueryBlocking, QueryBlockingData } from "./ApolloLinkBlocking"

export const useIsOpened = () => {
  const { data } = useQuery<QueryBlockingData>(QueryBlocking)

  return (data?.blocking.remaining || 0) > 0
}