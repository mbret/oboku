import { gql, useQuery, useLazyQuery, useMutation, QueryHookOptions, useApolloClient } from '@apollo/client';
import { BOOK_DETAILS_FRAGMENT } from '../books/queries';
import { useCallback } from 'react';
import { seriesOfflineResolvers } from './offlineResolvers';
import { Series, MutationEditSeriesVariables, MutationAddSeriesData, MutationAddSeriesVariables, MutationRemoveSeriesVariables, MutationEditSeriesData } from 'oboku-shared'

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

export const ADD_SERIES = gql`
  mutation ADD_SERIES($id: ID!, $name: String!) {
    addSeries(id: $id, name: $name) {
      id
      name
    }
  }
`

export const REMOVE_SERIES = gql`
  mutation REMOVE_SERIES($id: ID!) {
    removeSeries(id: $id) {
      id
    }
  }
`

export const EDIT_SERIES = gql`
  mutation EDIT_SERIES($id: ID!, $name: String) {
    editSeries(id: $id, name: $name) {
      id
      name
    }
  }
`

export const useQueryGetSeries = () => useQuery<GET_SERIES_DATA>(GET_SERIES)
export const useQueryGetOneSeries = (options: QueryHookOptions<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>) => useQuery<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>(GET_ONE_SERIES, options)
export const useLazyQueryGetOneSeries = () => useLazyQuery<GET_ONE_SERIES_DATA>(GET_ONE_SERIES)

export const useAddSeries = () => {
  const client = useApolloClient()
  const [addSeries] = useMutation<MutationAddSeriesData, MutationAddSeriesVariables>(ADD_SERIES)

  return useCallback((name: string) => {
    const series = seriesOfflineResolvers.Mutation.addSeries({ name }, { client })

    return addSeries({ variables: series })
  }, [addSeries, client])
}

export const useRemoveSeries = () => {
  const client = useApolloClient()

  const [removeSeries] = useMutation<any, MutationRemoveSeriesVariables>(REMOVE_SERIES);

  return useCallback((id: string) => {
    seriesOfflineResolvers.Mutation.removeSeries({ id }, { client })

    return removeSeries({ variables: { id } })

  }, [removeSeries, client])
}

export const useEditSeries = () => {
  const client = useApolloClient()

  const [editSeries] = useMutation<MutationEditSeriesData, MutationEditSeriesVariables>(EDIT_SERIES);

  return useCallback((id: string, name: string) => {
    seriesOfflineResolvers.Mutation.editSeries({ id, name }, { client })

    return editSeries({ variables: { id, name } })

  }, [editSeries, client])
}