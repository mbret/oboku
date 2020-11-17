import { useQuery, useLazyQuery, useMutation } from '@apollo/client';
import { useCallback } from 'react';
import { seriesOfflineResolvers } from './offlineResolvers';
import { Add_SeriesDocument, Edit_SeriesDocument, Remove_SeriesDocument, Query_One_Series_Document, Get_SeriesDocument } from '../generated/graphql';
import { useOfflineApolloClient } from '../useOfflineApolloClient';

export const useQueryGetSeries = () => useQuery(Get_SeriesDocument, { variables: { foo: 'asdasd' } })
export const useLazyQueryGetOneSeries = () => useLazyQuery(Query_One_Series_Document, { fetchPolicy: 'cache-only' })

export const useAddSeries = () => {
  const client = useOfflineApolloClient()
  const [addSeries] = useMutation(Add_SeriesDocument)

  return useCallback((name: string) => {
    const series = seriesOfflineResolvers.Mutation.addSeries({ name }, { client })

    return series && addSeries({ variables: series })
  }, [addSeries, client])
}

export const useRemoveSeries = () => {
  const client = useOfflineApolloClient()

  const [removeSeries] = useMutation(Remove_SeriesDocument);

  return useCallback((id: string) => {
    seriesOfflineResolvers.Mutation.removeSeries({ id }, { client })

    return removeSeries({ variables: { id } })

  }, [removeSeries, client])
}

export const useEditSeries = () => {
  const client = useOfflineApolloClient()

  const [editSeries] = useMutation(Edit_SeriesDocument);

  return useCallback((id: string, name: string) => {
    seriesOfflineResolvers.Mutation.editSeries({ id, name }, { client })

    return editSeries({ variables: { id, name } })

  }, [editSeries, client])
}