import { useQuery, useLazyQuery, gql, useMutation, useApolloClient } from "@apollo/client"
import { Tag, MutationAddTagVariables, MutationRemoveTagVariables, MutationEditTagVariables, MutationEditTagData, QueryTagVariables } from 'oboku-shared'
import { tagsOfflineResolvers } from "./offlineResolvers"
import { useCallback } from "react"

const MutationTagDetailsFragment = gql`
  fragment MutationTagDetailsFragment on Tag {
    __typename
    id
    name
    isProtected
  }
`

export const TAG_DETAILS_FRAGMENT = gql`
  fragment TagDetails on Tag {
    id
    name
    isProtected
    books {
      id
    }
  }
`

export const REMOVE_TAG = gql`
  mutation REMOVE_TAG($id: ID!) {
    removeTag(id: $id) {
      id
    }
  }
`

export const GET_TAGS = gql`
  query GET_TAGS {
    tags {
      id
      name
      isProtected
      books {
        id
      }
    }
  }
`

export type QueryTagData = { tag: Tag }
export const QueryTag = gql`
  query QueryTag($id: ID!) {
    tag(id: $id) {
      ...TagDetails
    }
  }
  ${TAG_DETAILS_FRAGMENT}
`

export const ADD_TAG = gql`
  mutation ADD_TAG($id: ID!, $name: String!) {
    addTag(id: $id, name: $name) {
      id
      name
    }
  }
`

export const EDIT_TAG = gql`
  mutation EDIT_TAG($id: ID!, $name: String, $isProtected: Boolean) {
    editTag(id: $id, name: $name, isProtected: $isProtected) {
      ...MutationTagDetailsFragment
    }
  }
  ${MutationTagDetailsFragment}
`

export const useQueryGetTags = () => useQuery<{ tags: Tag[] }>(GET_TAGS)
export const useLazyQueryGetTags = () => useLazyQuery<{ tags: Tag[] }>(GET_TAGS)
export const useLazyQueryGetTag = () => useLazyQuery<QueryTagData, QueryTagVariables>(QueryTag)

export const useCreateTag = () => {
  const client = useApolloClient()

  const [addTag] = useMutation<{ addTag: MutationAddTagVariables }, MutationAddTagVariables>(ADD_TAG);

  return useCallback((name: string) => {
    const tag = tagsOfflineResolvers.Mutation.addTag({ name }, { client })

    return addTag({ variables: tag })

  }, [addTag, client])
}

export const useRemoveTag = () => {
  const client = useApolloClient()

  const [removeTagMutation] = useMutation<any, MutationRemoveTagVariables>(REMOVE_TAG);

  return useCallback((id: string) => {
    tagsOfflineResolvers.Mutation.removeTag({ id }, { client })

    return removeTagMutation({ variables: { id } })

  }, [removeTagMutation, client])
}

export const useEditTag = () => {
  const client = useApolloClient()

  const [editTag] = useMutation<MutationEditTagData, MutationEditTagVariables>(EDIT_TAG);

  return useCallback((variables: MutationEditTagVariables) => {
    tagsOfflineResolvers.Mutation.editTag(variables, { client })

    return editTag({ variables })

  }, [editTag, client])
}

export const useTag = (id: string) => {
  return useQuery<QueryTagData, QueryTagVariables>(QueryTag, { variables: { id } })
}