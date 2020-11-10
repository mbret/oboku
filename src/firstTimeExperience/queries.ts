import { gql, useApolloClient, useQuery, } from "@apollo/client";
import { useCallback } from "react";

const defaultData: Required<FirstTimeExperience> = {
  hasDoneWelcomeTour: false
}

export type FirstTimeExperience = {
  hasDoneWelcomeTour?: boolean,
}

export type QueryFirstTimeExperienceData = { firstTimeExperience: FirstTimeExperience }
export const QueryFirstTimeExperience = gql`
  query QueryFirstTimeExperience {
    firstTimeExperience @client {
      hasDoneWelcomeTour
    }
  }
`

export const useFirstTimeExperience = () => {
  return useQuery<QueryFirstTimeExperienceData>(QueryFirstTimeExperience)
}

export const useSetFirstTimeExperience = () => {
  const client = useApolloClient()

  return useCallback((update: FirstTimeExperience) => {
    const data = client.readQuery<QueryFirstTimeExperienceData>({ query: QueryFirstTimeExperience })?.firstTimeExperience
    data && client.writeQuery<QueryFirstTimeExperienceData>({ query: QueryFirstTimeExperience, data: { firstTimeExperience: { ...data, ...update } } })
  }, [client])
}

export const useResetFirstTimeExperience = () => {
  const setFirstTimeExperience = useSetFirstTimeExperience()

  return useCallback(() => setFirstTimeExperience(defaultData), [setFirstTimeExperience])
}