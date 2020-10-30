import { gql, useQuery, useLazyQuery, useMutation, QueryHookOptions } from '@apollo/client';
import { Series, LibraryFilters, Tag } from './client';
import { BOOK_DETAILS_FRAGMENT } from './books/queries';

export const GET_TAGS = gql`
  query GET_TAGS {
    tags {
      id
      name
    }
  }
`

export const GET_TAG = gql`
  query GET_TAG($id: ID!) {
    tag(id: $id) {
      id
      name
    }
  }
`

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

type GET_ONE_SERIES_VARIABLES = { id: string }
type GET_ONE_SERIES_DATA = { oneSeries: Series }
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


export const GET_LIBRARY_FILTERS = gql`
    query GET_LIBRARY_FILTERS {
      libraryFilters @client {
        tags {
          id
        }
      }
    }
  `

export const ADD_TAG = gql`
  mutation ADD_TAG($name: String!) {
    addTag(name: $name) {
      id
      name
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

export const EDIT_TAG = gql`
  mutation EDIT_TAG($id: ID!, $name: String) {
    editTag(id: $id, name: $name) {
      id
      name
    }
  }
`

type ADD_SERIES_MUTATION_VARIABLES = { name: string }
export const ADD_SERIES = gql`
  mutation ADD_SERIES($name: String!) {
    addSeries(name: $name) {
      id
      name
    }
  }
`

type REMOVE_SERIES_MUTATION_VARIABLES = { id: string }
export const REMOVE_SERIES = gql`
  mutation REMOVE_SERIES($id: ID!) {
    removeSeries(id: $id) {
      id
    }
  }
`

type EDIT_SERIES_MUTATION_VARIABLES = { id: string, name?: string }
export const EDIT_SERIES = gql`
  mutation EDIT_SERIES($id: ID!, $name: String) {
    editSeries(id: $id, name: $name) {
      id
      name
    }
  }
`

// export const FOO = gql`
//   query FOO {
//     foo @client
//   }
// `;

export const useQueryGetSeries = () => useQuery<GET_SERIES_DATA>(GET_SERIES)
export const useQueryGetOneSeries = (options: QueryHookOptions<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>) => useQuery<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>(GET_ONE_SERIES, options)
export const useLazyQueryGetOneSeries = () => useLazyQuery<GET_ONE_SERIES_DATA>(GET_ONE_SERIES)
export const useMationAddSeries = () => useMutation<any, ADD_SERIES_MUTATION_VARIABLES>(ADD_SERIES)
export const useMutationRemoveSeries = () => useMutation<any, REMOVE_SERIES_MUTATION_VARIABLES>(REMOVE_SERIES)
export const useMutationEditSeries = () => useMutation<any, EDIT_SERIES_MUTATION_VARIABLES>(EDIT_SERIES)

export const useQueryGetTags = () => useQuery<{ tags: Tag[] }>(GET_TAGS)
export const useLazyQueryGetTags = () => useLazyQuery<{ tags: Tag[] }>(GET_TAGS)
export const useLazyQueryGetTag = () => useLazyQuery<{ tag: Tag }>(GET_TAG)

export const useQueryGetLibraryFilters = () => useQuery<{ libraryFilters: LibraryFilters }>(GET_LIBRARY_FILTERS)