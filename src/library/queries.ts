import { useQuery, gql, useApolloClient } from '@apollo/client';
import { useCallback } from 'react';
import { SyncLibraryDocument, Tag } from '../generated/graphql';
import { QueryTag } from '../tags/queries';

export type LibraryBooksSettings = {
  tags: Tag[],
  viewMode: 'grid' | 'list',
  sorting: 'alpha' | 'date' | 'activity'
}

type GET_LIBRARY_BOOKS_SETTINGS_DATA = { libraryBooksSettings: LibraryBooksSettings }
type GET_LIBRARY_BOOKS_SETTINGS_VARIABLES = {}
export const GET_LIBRARY_BOOKS_SETTINGS = gql`
  query GET_LIBRARY_BOOKS_SETTINGS {
    libraryBooksSettings @client {
      tags {
        id
      }
      viewMode
      sorting
    }
  }
`

export type QuerySyncData = { sync?: { happening?: boolean } }
export const QuerySync = gql`
  query QuerySync @client {
    sync {
      happening
    }
  }
`

export const useUpdateLibraryBooksSettings = () => {
  const client = useApolloClient()

  return [
    useCallback((data: Partial<LibraryBooksSettings>) => {
      const oldData = client.readQuery<GET_LIBRARY_BOOKS_SETTINGS_DATA>({ query: GET_LIBRARY_BOOKS_SETTINGS })

      client.writeQuery({
        query: GET_LIBRARY_BOOKS_SETTINGS, data: {
          libraryBooksSettings: {
            ...oldData?.libraryBooksSettings,
            ...data,
          }
        }
      })
    }, [client])
  ]
}

export const useLibraryBooksSettings = () => useQuery<GET_LIBRARY_BOOKS_SETTINGS_DATA, GET_LIBRARY_BOOKS_SETTINGS_VARIABLES>(GET_LIBRARY_BOOKS_SETTINGS)

export const useToggleLibraryBooksSettingsViewMode = () => {
  const client = useApolloClient()
  const [updateLibraryBooksSettings] = useUpdateLibraryBooksSettings()

  return [
    useCallback(() => {
      try {
        const data = client.readQuery<GET_LIBRARY_BOOKS_SETTINGS_DATA>({ query: GET_LIBRARY_BOOKS_SETTINGS })
        updateLibraryBooksSettings({ viewMode: data?.libraryBooksSettings.viewMode === 'grid' ? 'list' : 'grid' })
      } catch (e) {
        console.error(e)
      }
    }, [client, updateLibraryBooksSettings])
  ]
}

export const syncLibrary = async (client: ReturnType<typeof useApolloClient>) => {
  client.writeQuery<QuerySyncData>({ query: QuerySync, data: { sync: { happening: true } } })
  try {
    await client.query({ query: SyncLibraryDocument, fetchPolicy: 'network-only' }).catch(() => { })
  } catch (e) { }
  client.writeQuery<QuerySyncData>({ query: QuerySync, data: { sync: { happening: false } } })
}

export const useSyncLibrary = () => {
  const client = useApolloClient()

  return useCallback(async () => {
    syncLibrary(client)
  }, [client])
}

export const useIsSyncing = () => {
  const { data } = useQuery<QuerySyncData>(QuerySync)

  return !!data?.sync?.happening
}

export const useToggleTag = () => {
  const client = useApolloClient()
  const [updateLibraryBooksSettings] = useUpdateLibraryBooksSettings()

  return async (tagId: string) => {
    try {
      const librarySettingsData = client.readQuery<GET_LIBRARY_BOOKS_SETTINGS_DATA>({ query: GET_LIBRARY_BOOKS_SETTINGS })
      const currentTags = librarySettingsData?.libraryBooksSettings?.tags || []
      const { data } = await client.query({ query: QueryTag, variables: { id: tagId } })
      const tag = data?.tag

      let newTags: Tag[]
      if (currentTags?.find(item => item?.id === tagId)) {
        newTags = currentTags.filter(item => item?.id !== tagId)
      } else {
        newTags = [...currentTags, tag]
      }

      updateLibraryBooksSettings({ tags: newTags })
    } catch (e) {
      console.error(e)
    }
  }
}