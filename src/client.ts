import { ApolloClient, gql, InMemoryCache, makeVar, Reference } from '@apollo/client';
import { createHttpLink, HttpLink } from 'apollo-link-http';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { persistCache } from 'apollo3-cache-persist';
import localforage from 'localforage';
import { API_URI } from './constants';
import { GET_SERIES } from './queries';
import { difference } from 'ramda';

const onErrorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const link: any = ApolloLink.from([
  onErrorLink,
  new HttpLink({ uri: API_URI })
]);

export type Book = {
  id?: string,
  title?: string,
  tags?: Tag[],
  series?: Series[],
  lastMetadataUpdatedAt?: number,
  downloadState?: 'none' | 'downloaded' | 'downloading',
  author?: string
}

export type Tag = {
  id?: string,
  name?: string,
}

export type Series = {
  id?: string,
  name?: string,
  books?: Book[],
}

export type LibraryFilters = {
  tags: Tag[],
}

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

export const cache = new InMemoryCache({
  typePolicies: {
    Book: {
      fields: {
        downloadState: {
          read: (value = 'none') => value,
          merge: (_, incoming: string) => incoming,
        },
        series: {
          merge: (existing: Reference[], incoming: Reference[]) => incoming
        }
        // series: {
        //   merge: (existing: Reference[], incoming: Reference[], { cache, field, fieldName, args, readField, storeFieldName, toReference }) => {
        //     console.log('ASDASDASD', existing, incoming, fieldName, args)

        //     const removed = difference(existing, incoming)
        //     const added = difference(incoming, existing)

        //     removed.forEach(item => {
        //       const itemToRemoveId = cache.identify(item)
        //       cache.modify({
        //         id: itemToRemoveId,
        //         fields: {
        //           books: (existingValue: Reference[] = [], { toReference }) => {
        //             console.log('ASDASDASDASD',
        //               existingValue,
        //               existingValue.filter(v => cache.identify(v) !== itemToRemoveId),
        //               item,
        //               cache.identify(item),
        //               toReference(item),
        //             )
        //             // return existingValue.filter()

        //             return existingValue.filter(v => cache.identify(v) !== itemToRemoveId)
        //           }
        //         }
        //       })
        //     })
        //     // if (removed) {
        //     //   cache.modify({

        //     //   })
        //     // }

        //     return incoming
        //   }
        // }
      }
    },
    Query: {
      fields: {
        libraryFilters: {
          read: (value = { tags: [] }) => {
            console.warn('Query libraryFilters', value)

            return value
          }
        },
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
    Mutation: {
      fields: {
        // editBook: {
        //   merge: (existing: { editBook: Book }, incoming: { editBook: Book }, { readField, args,  }) => {
        //     console.log('FOOOOO', existing, incoming, args)

        //     return incoming
        //   }
        // },
        removeSeries: {
          merge: (existing, incoming) => {
            const item = cache.identify(incoming)
            cache.evict({ id: item })

            return incoming
          }
        },
        addSeries: {
          merge: (existing, incoming, { cache }) => {
            cache.modify({
              fields: {
                series: (prev = [], { toReference }) => {
                  return [...prev, toReference(incoming)]
                }
              }
            })

            return incoming
          },
        }
      }
    }
  }
})

const typeDefs = gql`
  extend type LibraryFilters {
    tags: Tag
  }

  extend type Query {
    libraryFilters: LibraryFilters
  }

  extend type Foo {
    result: Boolean
  }

  extend type Mutation {
    editLibraryFilters: Foo
  }
`;

export const getClient = async () => {
  await persistCache({
    cache,
    storage: (localforage as any),
  });

  return new ApolloClient({
    // uri: 'https://48p1r2roz4.sse.codesandbox.io',
    // link: createHttpLink({ uri: 'http://localhost:4000/graphql' }),
    // link: createHttpLink({ uri: 'https://48p1r2roz4.sse.codesandbox.io' }) as any,
    link,
    cache,
    // typeDefs,
    //   resolvers: {
    //     Mutation: {
    //       editLibraryFilters: (_root, variables, { cache }) => {
    //         console.warn(`resolvers mutation editLibraryFilters`, variables, cache.identify({
    //           __typename: 'LibraryFilters',
    //           // id: variables.id,
    //         }))
    //         cache.modify({
    //           id: cache.identify({
    //             __typename: 'LibraryFilters',
    //             // id: variables.id,
    //           }),
    //           fields: {
    //             tags: (prevValue) => variables.tags
    //           },
    //         });
    //         return null;
    //       }
    //     }
    //   }
  });
}