import { gql, useMutation } from "@apollo/client";
import { MutationEditLinkArgs, Mutation, MutationAddLinkArgs, MutationAddLinkDocument, MutationEditLinkDocument, LinkType } from '../generated/graphql'
import { useCallback } from "react";
import { linkOfflineResolvers } from "./offlineResolvers";
import { useOfflineApolloClient } from "../useOfflineApolloClient";

export const QueryFullLink = gql`
  query QueryFullLink($id: ID!) {
    link(id: $id) {
      id
      resourceId
    }
  }
`

export const useAddLink = () => {
  const client = useOfflineApolloClient()
  const [addLink] = useMutation(MutationAddLinkDocument)

  return useCallback((resourceId: string, type: LinkType, bookId: string) => {
    const link = linkOfflineResolvers.Mutation.addLink({ bookId, resourceId, type }, { client })

    addLink({ variables: { ...link, bookId } })
  }, [addLink, client])
}

export const useEditLink = () => {
  const client = useOfflineApolloClient()
  const [editLink] = useMutation(MutationEditLinkDocument)

  return useCallback((bookId: string, id: string, resourceId: string, type: LinkType) => {
    linkOfflineResolvers.Mutation.editLink({ id, bookId, resourceId, type }, { client })

    editLink({ variables: { id, resourceId, type } })
  }, [editLink, client])
}