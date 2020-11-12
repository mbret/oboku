import { gql, useMutation, useApolloClient } from "@apollo/client";
import { MutationEditLinkArgs, Mutation, MutationAddLinkArgs } from '../generated/graphql'
import { useCallback } from "react";
import { linkOfflineResolvers } from "./offlineResolvers";

export const QueryFullLink = gql`
  query QueryFullLink($id: ID!) {
    link(id: $id) {
      id
      location
    }
  }
`

export const MutationEditLink = gql`
  mutation MutationEditLink($id: ID!, $location: String!) {
    editLink(id: $id, location: $location) {
      id
    }
  }
`

const MutationAddLink = gql`
  mutation MutationAddLink($id: ID!, $bookId: ID!, $location: String!) {
    addLink(id: $id, bookId: $bookId, location: $location) {
      id
    }
  }
`;

export const useAddLink = () => {
  const client = useApolloClient()
  const [addLink] = useMutation<Mutation['addLink'], MutationAddLinkArgs>(MutationAddLink)

  return useCallback((location: string, bookId: string) => {
    const link = linkOfflineResolvers.Mutation.addLink({ bookId, location }, { client })

    addLink({ variables: { id: link.id, bookId, location } })
  }, [addLink, client])
}

export const useEditLink = () => {
  const client = useApolloClient()
  const [editLink] = useMutation<Mutation['editLink'], MutationEditLinkArgs>(MutationEditLink)

  return useCallback((bookId: string, id: string, location: string) => {
    linkOfflineResolvers.Mutation.editLink({ id, bookId, location }, { client })

    editLink({ variables: { id, location } })
  }, [editLink, client])
}