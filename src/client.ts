import { ApolloClient, InMemoryCache, makeVar } from '@apollo/client';
import { HttpLink } from 'apollo-link-http';
import { RetryLink } from "apollo-link-retry";
import apolloLogger from 'apollo-link-logger';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { persistCache } from 'apollo3-cache-persist';
import localforage from 'localforage';
import { API_URI } from './constants';
import { GET_LIBRARY_BOOKS_SETTINGS } from './library/queries';
import { QueryBooks, QueryBooksData } from './books/queries';
import { ApolloLinkOfflineQueue } from './apollo-link-offline-queue'
import { GET_TAGS } from './tags/queries';
import { GET_SERIES } from './series/queries';
import { useState, useEffect } from 'react';
import { setContext } from 'apollo-link-context'
import { QueryAuth, QueryAuthData } from './auth/queries';
import { authLink } from './auth/authLink';
import { rules as booksOfflineRules } from './books/offlineRules';
import { ApolloLinkBlocking } from './apollo-link-blocking/ApolloLinkBlocking';
import { getMainDefinition } from './utils';
import { ApolloLinkDirective } from './apollo-link-directive/ApolloLinkDirective';
import { libraryLink } from './library/LibraryLink';
import { defaultData } from './firstTimeExperience/queries';
import { TypedTypePolicies, FirstTimeExperience } from './generated/graphql';
import { mergeDeepLeft } from 'ramda';

let clientForContext: ApolloClient<any> | undefined

const onErrorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const context = operation.getContext()
  const cache = context.cache as InMemoryCache

  if (graphQLErrors)
    graphQLErrors.forEach((error) => {
      if ((error.extensions as any)?.code === 'UNAUTHENTICATED') {
        cache.writeQuery<QueryAuthData>({ query: QueryAuth, data: { auth: { token: null } } })
        console.warn('UNAUTHENTICATED error, user has been logged out')
      } else {
        console.warn('[graphQLErrors]', error)
      }
    });
  if (networkError) console.warn(`[Network error]`, networkError);
});

export const offlineQueue = new ApolloLinkOfflineQueue({
  rules: [booksOfflineRules]
})

const blockingLink = new ApolloLinkBlocking()

const withClientLink = setContext((operation, { headers = {}, cache }: { headers?: any, cache: InMemoryCache }) => {
  const definition = getMainDefinition(operation.query)

  return {
    client: clientForContext,
    noRetry: definition.directives?.find(directive => directive.name.value === 'noRetry'),
  }
})

const authContextLink = setContext((operation, { headers = {}, cache }: { headers?: any, cache: InMemoryCache }) => {
  const data = cache.readQuery<QueryAuthData>({ query: QueryAuth })
  const authToken = data?.auth.token

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

const link: any = ApolloLink.from([
  // new ApolloLinkWithCLient(),
  withClientLink,
  authLink,
  libraryLink,
  onErrorLink,
  apolloLogger,
  offlineQueue,
  blockingLink,
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
      downloadState: {
        read: (value = 'none') => value,
        merge: (_, incoming: string) => incoming,
      },
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

const typePolicies: TypedTypePolicies = {
  Tag: {
    fields: {
      isProtected: (value = false) => value,
    }
  },
  Book: {
    fields: {
      // series: {
      //   merge: (existing: Reference[], incoming: Reference[]) => incoming
      // }
    }
  },
  Query: {
    fields: {
      book: {
        // This proxy allow us to not have to precache this query
        read: (_, { toReference, args, variables }) => toReference({
          __typename: 'Book',
          id: args?.id,
        })
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

// export const persistor = new CachePersistor({
//   cache,
//   storage: (localforage as any),
//   debug: true,
// })

export const useClient = () => {
  const [client, setClient] = useState<ApolloClient<any> | undefined>(undefined)
  // @todo https://www.apollographql.com/docs/react/networking/authentication/
  // const [authToken] = useAuthToken()

  clientForContext = client

  useEffect(() => {
    (async () => {
      await persistCache({
        cache,
        storage: (localforage as any),
        debug: true,
      });

      const client = new ApolloClient({
        link,
        cache,
      });

      // @ts-ignore
      window.__client = client;

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
          let data
          try {
            data = cache.readQuery<QueryBooksData>({ query: QueryBooks })
          } catch (e) { }

          if (!data) {
            cache.writeQuery<QueryBooksData>({ query: QueryBooks, data: { books: { __typename: 'Books', timestamp: Date.now(), books: [] } } })
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
          let data = null
          try {
            data = cache.readQuery({ query: GET_SERIES })
          } catch (e) { }

          if (data === null) {
            cache.writeQuery({ query: GET_SERIES, data: { series: [] } })
          }
        },
        () => {
          let data = null
          try {
            data = cache.readQuery({ query: QueryAuth })
          } catch (e) { }

          if (data === null) {
            cache.writeQuery<QueryAuthData>({ query: QueryAuth, data: { auth: { token: null } } })
          }
        },
      ].map(fn => fn())

      await libraryLink.init(client)
      blockingLink.reset(client)
      offlineQueue.restoreQueue(client)

      console.log('cache', cache.extract())

      setClient(client)
    })()
  }, [])

  return client
}

