import { useMutation } from '@apollo/client';
import {
  MutationEditBookArgs, MutationRemoveTagsToBookArgs, LinkType,
  AddBookDocument, RemoveBookDocument, Edit_BookDocument, QueryBookDocument, MutationAddTagsToBookDocument,
  MutationRemoveTagsToBookDocument,
} from '../generated/graphql'
import { difference } from 'ramda';
import { useCallback } from 'react';
import { bookOfflineResolvers } from './offlineResolvers';
import { useAddLink } from '../links/queries';
import { useOfflineApolloClient } from '../useOfflineApolloClient';

export const useRemoveBook = () => {
  const client = useOfflineApolloClient()
  const [removeBook] = useMutation(RemoveBookDocument);

  return useCallback((id: string) => {
    bookOfflineResolvers.removeBook({ id }, { client })

    return removeBook({ variables: { id } })
  }, [removeBook, client])
}

export const useAddBook = () => {
  const client = useOfflineApolloClient()
  const [addBook] = useMutation(AddBookDocument)
  const addLink = useAddLink()

  return useCallback(async (resourceId: string, linkType: LinkType) => {
    const book = bookOfflineResolvers.addBook({}, { client })

    addBook({ variables: { id: book.id } })
    // @todo it should wait for book being created
    addLink(resourceId, linkType, book.id)
  }, [addBook, client, addLink])
}

export const useEditBook = () => {
  const [editBook] = useMutation(Edit_BookDocument)
  const [addTagsToBook] = useMutation(MutationAddTagsToBookDocument)
  const [removeTagsToBook] = useMutation<any, MutationRemoveTagsToBookArgs>(MutationRemoveTagsToBookDocument)
  const client = useOfflineApolloClient()

  return useCallback((variables: MutationEditBookArgs & { tags?: string[] }) => {
    const oldData = client.cache.readQuery({ query: QueryBookDocument, variables: { id: variables.id } })

    bookOfflineResolvers.editBook(variables, { client })

    const { tags, id, ...rest } = variables

    if (Object.keys(rest).length > 0) {
      editBook({ variables: { id, ...rest } })
    }

    if (oldData?.book) {
      if (tags) {
        const existingTags = (oldData.book.tags || []).map(item => item?.id || '')
        const removed = difference(existingTags, tags)
        const added = difference(tags, existingTags)

        if (added.length > 0) {
          addTagsToBook({ variables: { id: variables.id, tags: added } })
        }

        if (removed.length > 0) {
          removeTagsToBook({ variables: { id: variables.id, tags: removed } })
        }
      }
    }
  }, [editBook, client, addTagsToBook, removeTagsToBook])
}