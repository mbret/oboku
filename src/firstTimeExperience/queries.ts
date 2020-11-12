import { useApolloClient, } from "@apollo/client";
import { useCallback } from "react";
import { FirstTimeExperience, QueryFirstTimeExperienceDocument } from '../generated/graphql'

export const defaultData: FirstTimeExperience = {
  __typename: 'FirstTimeExperience',
  hasDoneWelcomeTour: false,
  hasDoneReaderTour: false,
}

export const useSetFirstTimeExperience = () => {
  const client = useApolloClient()

  return useCallback((update: FirstTimeExperience) => {
    const data = client.readQuery({ query: QueryFirstTimeExperienceDocument })?.firstTimeExperience
    data && client.writeQuery({ query: QueryFirstTimeExperienceDocument, data: { firstTimeExperience: { ...data, ...update } } })
  }, [client])
}

export const useResetFirstTimeExperience = () => {
  const setFirstTimeExperience = useSetFirstTimeExperience()

  return useCallback(() => setFirstTimeExperience(defaultData), [setFirstTimeExperience])
}