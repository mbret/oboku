import { ApolloClient, FieldFunctionOptions, InMemoryCache, makeVar, Reference } from '@apollo/client';
import { HttpLink } from 'apollo-link-http';
import { RetryLink } from "apollo-link-retry";
import apolloLogger from 'apollo-link-logger';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { persistCache } from 'apollo3-cache-persist';
import localforage from 'localforage';
import { API_URI } from './constants';
import { GET_LIBRARY_BOOKS_SETTINGS } from './library/queries';
import { ApolloLinkOfflineQueue } from './apollo-link-offline-queue'
import { GET_TAGS } from './tags/queries';
import { useState, useEffect } from 'react';
import { setContext } from 'apollo-link-context'
import { authLink } from './auth/authLink';
import { rules as booksOfflineRules } from './books/offlineRules';
import { ApolloLinkBlocking } from './apollo-link-blocking/ApolloLinkBlocking';
import { getMainDefinition } from './utils';
import { ApolloLinkDirective } from './apollo-link-directive/ApolloLinkDirective';
import { libraryLink } from './library/LibraryLink';
import { defaultData } from './firstTimeExperience/queries';
import { dataSourcesLink } from './dataSources/DataSourcesLink';
import { TypedTypePolicies, FirstTimeExperience, QueryUserIsLibraryProtectedDocument, QueryAuthDocument, Get_SeriesDocument, User, FragmentInitAppFragmentDoc } from './generated/graphql';
import { mergeDeepLeft } from 'ramda';
import { ApolloLinkOfflineQueries } from './apollo-link-offline-queries';
import { seriesLink } from './series/SeriesLink';
import { booksLink } from './books/BooksLink';
import { OfflineApolloClient } from './useOfflineApolloClient';
import { appLink } from './AppLink';

export { OfflineApolloClient }

export declare function useApolloClient(): any;

let clientForContext: ApolloClient<any> | undefined

const onErrorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const context = operation.getContext()
  console.warn(context)
  const cache = context.cache as InMemoryCache

  if (graphQLErrors)
    graphQLErrors.forEach((error) => {
      if ((error.extensions as any)?.code === 'UNAUTHENTICATED') {
        cache.modify({
          fields: {
            auth: (existing = {}) => ({ ...existing, token: null })
          }
        })
        console.warn('UNAUTHENTICATED error, user has been logged out')
      } else {
        console.warn('[graphQLErrors]', error)
      }
    });
  if (networkError) console.warn(`[Network error]`, networkError, operation);
});

export const offlineQueue = new ApolloLinkOfflineQueue({
  rules: [booksOfflineRules]
})

const blockingLink = new ApolloLinkBlocking()

const withApolloClientInContextLink = setContext((operation, { headers = {}, cache }: { headers?: any, cache: InMemoryCache }) => {
  const definition = getMainDefinition(operation.query)

  return {
    client: clientForContext,
    noRetry: definition.directives?.find(directive => directive.name.value === 'noRetry'),
  }
})

const authContextLink = setContext((operation, { headers = {}, cache }: { headers?: any, cache: InMemoryCache }) => {
  const data = cache.readQuery({ query: QueryAuthDocument })
  const authToken = data?.auth?.token

  return {
    headers: {
      ...headers,
      authorization: authToken ? `Bearer ${authToken}` : ''
    }
  }
})

const directiveLink = new ApolloLinkDirective([
  { name: 'noRetry', remove: true },
])

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 5000,
    jitter: true
  },
  attempts: {
    retryIf: (error, operation) => {
      if (error.statusCode === 400) return false

      // Do not retry @noRetry directive
      if (operation.getContext().noRetry) {
        return false
      }

      return true
    },
    /**
     * Network error requests are never sent back
     */
    max: Infinity,
  }
})

const offlineQueriesLink = new ApolloLinkOfflineQueries()

const link: any = ApolloLink.from([
  withApolloClientInContextLink,
  onErrorLink,
  apolloLogger,
  blockingLink,

  // custom offline links
  authLink,
  libraryLink,
  seriesLink,
  booksLink,
  dataSourcesLink,
  appLink,

  offlineQueriesLink,
  offlineQueue,
  retryLink,
  authContextLink,
  directiveLink,
  new HttpLink({ uri: API_URI }),
]);

export interface Todo {
  text: string;
  completed: boolean;
  id: number
}

export type Todos = Todo[];

const todosInitialValue: Todos = [
  {
    id: 0,
    completed: false,
    text: "Use Apollo Client 3"
  }
]

export const todosVar = makeVar<Todos>(
  todosInitialValue
);

const isBookActionDialogOpenedWithVar = makeVar<string | undefined>(undefined)

export const models = {
  isBookActionDialogOpenedWithVar,
}

const localTypePolocies = {
  User: {
    fields: {
      isLibraryUnlocked: (value = false) => value,
    },
  },
  Book: {
    fields: {
      downloadProgress: (value = 0) => value,

    }
  },
  Query: {
    fields: {
      isBookActionDialogOpenedWith: {
        read() {
          return isBookActionDialogOpenedWithVar()
        }
      },
      todos: {
        read() {
          return todosVar();
        }
      }
    }
  },
}

const filterOutUnprotectedBooks = (value: Reference[], { readField }: FieldFunctionOptions) => {
  const { user } = cache.readQuery({ query: QueryUserIsLibraryProtectedDocument }) || {}

  // Filter out unprotected contents
  if (user?.isLibraryUnlocked !== true) {
    return value.filter(ref => {
      const tags: readonly Reference[] | undefined = readField('tags', ref)
      return !tags?.some(tag => readField('isProtected', tag))
    })
  }

  return value
}

const typePolicies: TypedTypePolicies = {
  Tag: {
    fields: {
      isProtected: (value = false) => value,
    }
  },
  Book: {
    fields: {
      series: {
        merge: (_, incoming) => incoming,
      },
      downloadState: {
        read: (value = 'none') => value,
        merge: (_, incoming: string) => incoming,
      },
    }
  },
  Series: {
    fields: {
      books: {
        read: (value: Reference[] | undefined = [], options) => {
          return filterOutUnprotectedBooks(value, options)
        }
      }
    }
  },
  Query: {
    fields: {
      app: {
        read: (_, { toReference }) => toReference({ __typename: 'App', id: '_' }),
      },
      user: {
        read: (value: User) => value || null,
      },
      syncState: {
        merge: (_, incoming) => incoming,
      },
      book: {
        read: (_, { toReference, args }) => toReference({ __typename: 'Book', id: args?.id, })
      },
      series: {
        read: (value: Reference[] = [], { variables, readField, }) => {
          // console.log(value, variables, cache.readQuery({ query: QuerySeriesIdsDocument }))
          // console.warn('READ SERIES', value.map(ref => rea), variables)

          return value
        },
        merge: (existing, incoming) => {
          // console.warn('MERGE SERIES', incoming)
          return incoming
        },
      },
      books: {
        read: (value: Reference[] = [], options) => {
          return filterOutUnprotectedBooks(value, options)
        },
        merge: (_, incoming) => incoming,
      },
      oneSeries: {
        read: (_, { toReference, args, }) => {
          // console.log(toReference({ __typename: 'Series', id: args?.id, }))
          return toReference({ __typename: 'Series', id: args?.id, })
        }
      },
      firstTimeExperience: (existing: FirstTimeExperience = defaultData) => existing,
    }
  },
  Mutation: {
    fields: {
      // addBook: {
      //   merge: (_, incoming: Book | Reference, { isReference, cache, toReference, readField }) => {
      //     if (isReference(incoming)) {
      //       console.warn(incoming, readField('createdAt', incoming), cache.extract())
      //       const existingData = cache.readQuery<GET_BOOKS_DATA>({ query: GET_BOOKS })

      //       // cache.writeQuery({ query: GET_BOOKS, data: { books: [...existingData?.books || [], toReference(incoming)] } })
      //       // cache.writeQuery({ query: GET_BOOKS, data: { books: [] } })
      //       cache.modify({
      //         fields: {
      //           books: (prev) => [...prev || [], incoming]
      //         }
      //       })
      //       console.warn(existingData, cache.extract())
      //     }

      //     return incoming
      //   }
      // },
      // removeSeries: {
      //   merge: (existing, incoming) => {
      //     const item = cache.identify(incoming)
      //     cache.evict({ id: item })

      //     return incoming
      //   }
      // },
      // addSeries: {
      //   merge: (existing, incoming, { cache }) => {
      //     cache.modify({
      //       fields: {
      //         series: (prev = [], { toReference }) => {
      //           return [...prev, toReference(incoming)]
      //         }
      //       }
      //     })

      //     return incoming
      //   },
      // }
    }
  }
}

export const cache = new InMemoryCache({
  typePolicies: mergeDeepLeft(localTypePolocies, typePolicies)
})

export const loadClient = async () => {
  await persistCache({
    cache,
    storage: (localforage as any),
    debug: true,
  });

  const client = new OfflineApolloClient({
    link,
    cache,
    defaultOptions: {
      /**
       * The useQuery hook uses Apollo Client's watchQuery function. 
       * To set defaultOptions when using the useQuery hook, make sure 
       * to set them under the defaultOptions.watchQuery property.
       */
      watchQuery: {
        returnPartialData: true,
        fetchPolicy: 'cache-only',
      },
      query: {
        fetchPolicy: 'cache-only',
      }
    }
  });

  // precache for offline purpose
  [
    () => {
      let data = null
      try {
        data = cache.readQuery({ query: GET_LIBRARY_BOOKS_SETTINGS })
      } catch (e) { }

      if (data === null) {
        cache.writeQuery({
          query: GET_LIBRARY_BOOKS_SETTINGS,
          data: {
            libraryBooksSettings: { tags: [], viewMode: 'grid', sorting: 'date' }
          }
        })
      }
    },
    () => {
      let data = null
      try {
        data = cache.readQuery({ query: GET_TAGS })
      } catch (e) { }

      if (data === null) {
        cache.writeQuery({ query: GET_TAGS, data: { tags: [] } })
      }
    },
    () => {
      let data
      try {
        data = cache.readQuery({ query: Get_SeriesDocument })
      } catch (e) { }

      if (!data) {
        cache.writeQuery({ query: Get_SeriesDocument, data: { series: [] } })
      }
    },
    () => {
      let data
      try {
        data = cache.readQuery({ query: QueryAuthDocument })
      } catch (e) { }

      if (!data) {
        cache.writeQuery({ query: QueryAuthDocument, data: { auth: { token: null, isAuthenticated: false } } })
      }
    },
  ].map(fn => fn())

  await appLink.init(client)
  await libraryLink.init(client)
  await booksLink.init(client)
  await dataSourcesLink.init(client)
  blockingLink.reset(client)

  offlineQueue.restoreQueue(client)

  console.warn('Apollo cache after boot', cache.extract())

  return client
}

export const loadingClient = loadClient()

export const getClient = () => loadingClient

export const useClient = () => {
  const [loadedClient, setLoadedClient] = useState<OfflineApolloClient<any> | undefined>(undefined)

  useEffect(() => {
    (async () => {
      const client = await getClient()

      clientForContext = client

      // @ts-ignore
      window.__client = client;

      setLoadedClient(client)
    })()
  }, [])

  return loadedClient
}

