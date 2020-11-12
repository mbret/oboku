import { gql, useQuery, useLazyQuery, useMutation, QueryHookOptions, useApolloClient } from '@apollo/client';
import { BOOK_DETAILS_FRAGMENT } from '../books/queries';
import { useCallback } from 'react';
import { seriesOfflineResolvers } from './offlineResolvers';
import { MutationRemoveSeriesArgs, Series, Add_SeriesDocument, Edit_SeriesDocument, Remove_SeriesDocument } from '../generated/graphql';

type GET_SERIES_DATA = { series: Series[] }
export const GET_SERIES = gql`
  query GET_SERIES {
    series {
      id
      name
      books {
        id
      }
    }
  }
`

export type GET_ONE_SERIES_VARIABLES = { id: string }
export type GET_ONE_SERIES_DATA = { oneSeries: Series }
export const GET_ONE_SERIES = gql`
  query GET_ONE_SERIES($id: ID!) {
    oneSeries(id: $id) {
      id
      name
      books {
        ...BookDetails
      }
    }
  }
  ${BOOK_DETAILS_FRAGMENT}
`

export const useQueryGetSeries = () => useQuery<GET_SERIES_DATA>(GET_SERIES)
export const useQueryGetOneSeries = (options: QueryHookOptions<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>) => useQuery<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>(GET_ONE_SERIES, options)
export const useLazyQueryGetOneSeries = () => useLazyQuery<GET_ONE_SERIES_DATA>(GET_ONE_SERIES)

export const useAddSeries = () => {
  const client = useApolloClient()
  const [addSeries] = useMutation(Add_SeriesDocument)

  return useCallback((name: string) => {
    const series = seriesOfflineResolvers.Mutation.addSeries({ name }, { client })

    return series && addSeries({ variables: series })
  }, [addSeries, client])
}

export const useRemoveSeries = () => {
  const client = useApolloClient()

  const [removeSeries] = useMutation(Remove_SeriesDocument);

  return useCallback((id: string) => {
    seriesOfflineResolvers.Mutation.removeSeries({ id }, { client })

    return removeSeries({ variables: { id } })

  }, [removeSeries, client])
}

export const useEditSeries = () => {
  const client = useApolloClient()

  const [editSeries] = useMutation(Edit_SeriesDocument);

  return useCallback((id: string, name: string) => {
    seriesOfflineResolvers.Mutation.editSeries({ id, name }, { client })

    return editSeries({ variables: { id, name } })

  }, [editSeries, client])
}