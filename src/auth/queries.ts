import { useMutation, } from "@apollo/client";
import { useCallback } from "react";
import { MutationSignupDocument, MutationSigninDocument, QueryUserIdDocument } from '../generated/graphql'
import { useOfflineApolloClient } from "../useOfflineApolloClient";

export const useSignup = () => {
  const [signup, result] = useMutation(MutationSignupDocument)

  const enhancedQuery = useCallback(async (email: string, password: string) => {
    return signup({ variables: { email, password }, }).catch(_ => { })
  }, [signup])

  return [enhancedQuery, result] as [typeof enhancedQuery, typeof result]
}

export const useSignin = () => {
  const [signin, result] = useMutation(MutationSigninDocument)

  const enhancedQuery = useCallback(async (email: string, password: string) => {
    return signin({ variables: { email, password }, }).catch(_ => { })
  }, [signin])

  return [enhancedQuery, result] as [typeof enhancedQuery, typeof result]
}

export const useToggleContentProtection = () => {
  const client = useOfflineApolloClient()

  return useCallback(() => {
    const data = client.readQuery({ query: QueryUserIdDocument })
    client.modify('User', {
      id: client.identify({ __typename: 'User', id: data?.user?.id }),
      fields: {
        isLibraryUnlocked: value => !value,
      }
    })
  }, [client])
}