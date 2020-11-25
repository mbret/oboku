import { Observable } from '@apollo/client';
import {
  ApolloLink,
  Operation,
  NextLink,
} from '@apollo/client/link/core';
import { FetchResult } from 'apollo-link';
import { getMainDefinition } from './utils';

export class ApolloLinkOfflineOperations extends ApolloLink {
  public request(operation: Operation, forward: NextLink) {
    const definition = getMainDefinition(operation.query)
    const isOfflineDirective = definition.directives?.find(directive => directive.name.value === 'offline')

    if (isOfflineDirective) {
      return new Observable<FetchResult>((subscriber) => {
        subscriber.next({
          context: { offline: true }
        })
        subscriber.complete()
      });
    }

    return forward(operation)
  }
}