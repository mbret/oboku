import {
  ApolloLink,
  Operation,
  FetchResult,
  NextLink,
} from '@apollo/client/link/core';
import {
  Observable,
  Observer,
} from '@apollo/client/utilities';

export interface OperationQueueEntry {
  operation: Operation;
  forward: NextLink;
  observer: Observer<FetchResult>;
  subscription?: { unsubscribe: () => void };
}