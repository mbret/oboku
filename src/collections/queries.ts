import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { collectionOfflineResolvers } from './offlineResolvers';
import { Edit_CollectionDocument, Remove_CollectionDocument, Query_Collection_Document, Get_CollectionsDocument } from '../generated/graphql';
import { useOfflineApolloClient } from '../useOfflineApolloClient';

export const useQueryGetCollection = () => useQuery(Get_CollectionsDocument, { variables: { foo: 'asdasd' } })
export const useLazyQueryGetCollection = () => useLazyQuery(Query_Collection_Document, { fetchPolicy: 'cache-only' })

export const useRemoveCollection = () => {
  const client = useOfflineApolloClient()

  const [removeCollection] = useMutation(Remove_CollectionDocument);

  return useCallback((id: string) => {
    collectionOfflineResolvers.Mutation.removeCollection({ id }, { client })

    return removeCollection({ variables: { id } })

  }, [removeCollection, client])
}

export const useEditCollection = () => {
  const client = useOfflineApolloClient()

  const [editCollection] = useMutation(Edit_CollectionDocument);

  return useCallback((id: string, name: string) => {
    collectionOfflineResolvers.Mutation.editCollection({ id, name }, { client })

    return editCollection({ variables: { id, name } })

  }, [editCollection, client])
}