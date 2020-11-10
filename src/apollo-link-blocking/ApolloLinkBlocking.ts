import {
  ApolloLink,
  Operation,
  FetchResult,
  NextLink,
} from '@apollo/client/link/core';
import {
  Observable, removeDirectivesFromDocument,
} from '@apollo/client/utilities';
import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
import { getMainDefinition } from './utils';

export type QueryBlockingData = { blocking: { remaining: number } }
export const QueryBlocking = gql`
  query Blocking { 
    blocking { 
      remaining
    } 
  }
`

export class ApolloLinkBlocking extends ApolloLink {
  public request(operation: Operation, forward: NextLink) {
    const definition = getMainDefinition(operation.query)
    const context = operation.getContext()
    const cache = context.cache as InMemoryCache
    const isBlockingDirective = definition.directives?.find(directive => directive.name.value === 'blocking')

    if (isBlockingDirective) {
      const cleanedQuery = removeDirectivesFromDocument([{ name: 'blocking' }], operation.query)
      if (cleanedQuery) {
        operation.query = cleanedQuery
      }
      
      let remaining = 0
      try {
        const data = cache.readQuery<QueryBlockingData>({ query: QueryBlocking })
        if (data) {
          remaining = data?.blocking?.remaining as number | undefined || remaining
        }
      } catch (e) { }
      cache.writeQuery<QueryBlockingData>({ query: QueryBlocking, data: { blocking: { remaining: ++remaining } } })
    }

    const onDone = () => {
      if (isBlockingDirective) {
        setTimeout(() => {
          const data = cache.readQuery<QueryBlockingData>({ query: QueryBlocking })
          let newValue = (data?.blocking?.remaining || 0) - 1
          if (newValue < 0) {
            console.error('ApolloLinkBlocking: blocking indice cannot be substracted more for this operation. Please fix your code', operation)
            newValue = 0
          }
          cache.writeQuery<QueryBlockingData>({ query: QueryBlocking, data: { blocking: { remaining: newValue } } })
        }, 500)
      }
    }

    return new Observable<FetchResult>(observer => {
      const sub = forward(operation).subscribe({
        next: (value) => observer.next(value),
        error: (e) => {
          onDone()
          observer.error(e)
        },
        complete: () => {
          onDone()
          observer.complete()
        }
      })

      return () => {
        if (sub) sub.unsubscribe();
      };
    })
  }

  public reset = (client: ApolloClient<any>) => {
    client.writeQuery<QueryBlockingData>({ query: QueryBlocking, data: { blocking: { remaining: 0 } } })
  }
}