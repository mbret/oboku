import {
  ApolloLink,
  Operation,
  FetchResult,
  NextLink,
} from '@apollo/client/link/core';
import {
  Observable,
  Observer,
  removeDirectivesFromDocument,
} from '@apollo/client/utilities';
import { OperationQueueEntry } from './types';
import { difference } from 'ramda';
import { ApolloClient } from '@apollo/client';
import { defaultRules } from './defaultRules';
import { getMainDefinition } from './utils';

export type Rule = (queue: OperationQueueEntry[], newEntry: OperationQueueEntry) => OperationQueueEntry[]

export class ApolloLinkOfflineQueue extends ApolloLink {
  private opQueue: OperationQueueEntry[] = [];
  protected rules: Rule[] = []
  protected isFirstItemBeingProcessed = false

  constructor({ rules = [] }: { rules: Rule[] }) {
    super()
    this.rules = [defaultRules, ...rules]
  }

  public request(operation: Operation, forward: NextLink) {
    const definition = getMainDefinition(operation.query)
    console.log(getMainDefinition(operation.query))

    if (
      definition.directives?.find(directive => directive.name.value === 'asyncQueue')
      || operation.getContext().skipQueue
    ) {
      const cleanedQuery = removeDirectivesFromDocument([{ name: 'asyncQueue' }], operation.query)
      if (cleanedQuery) {
        operation.query = cleanedQuery
      }
      return forward(operation);
    }

    return new Observable<FetchResult>((observer: Observer<FetchResult>) => {
      const operationEntry = { operation, forward, observer };

      this.enqueue(operationEntry);

      return () => {
        this.cancelOperation(operationEntry)
      };
    });
  }

  private cancelOperation(entry: OperationQueueEntry) {
    this.opQueue = this.opQueue.filter(e => e !== entry);
  }

  private enqueue(entry: OperationQueueEntry) {
    const newQueue = [...this.opQueue, entry]
    const queueToPassToRules = this.isFirstItemBeingProcessed ? newQueue.slice(1) : newQueue

    const newQueueAfterRules = this.rules
      .reduce((currentQueue, currentRule) => {
        return currentRule(currentQueue, entry)
      }, queueToPassToRules)

    const restoredQueueAfterRules = this.isFirstItemBeingProcessed ? [this.opQueue[0], ...newQueueAfterRules] : newQueueAfterRules

    const removed = difference(newQueue, restoredQueueAfterRules)

    console.warn('removed',
      newQueue,
      newQueueAfterRules,
      restoredQueueAfterRules,
      removed)

    removed.forEach(({ observer }) => {
      observer.next && observer.next({
        data: null,
        context: {
          cancelled: true
        }
      })
      observer.complete && observer.complete()
    })

    this.opQueue = restoredQueueAfterRules

    this.persistQueue()

    console.info(`[apolloLinkQueue] queue(${this.opQueue.length}) enqueue`, this.opQueue.length, this.opQueue)

    this.continueWithTheQueue()
  }

  /**
   * Continue processing the queue.
   * We take the first element in the queue and forward it.
   * When this operation is done we trigger the same method again to
   * loop over the queue.
   * 
   * @warning
   * We keep the processing element inside the queue so that it's always
   * persisted as long as we do not have a response. There is basically two strategy and none of them
   * is perfect
   * 
   * - assume the operation is done once it passes here. We will not persist it but maybe it's not even sent completely
   *   to the server. We could potentially never replay it since it will be lost between the links
   * 
   * - assume the operation is not done as long as we do not have data back. In case of app reload we will
   *   always replay it since it is persisted (still in the queue). That way we never loose any mutation. However
   *   it could generate an error if the mutation had been processed on the server but the response never reached us.
   *   I think it's safer to deal with an error like this rather than missing data.
   */
  private continueWithTheQueue = () => {
    console.info(`[apolloLinkQueue] queue`, this.isFirstItemBeingProcessed, this.opQueue)
    if (this.isFirstItemBeingProcessed || this.opQueue.length === 0) return

    console.info(`[apolloLinkQueue] queue(${this.opQueue.length}) continueWithTheQueue`)

    const { operation, forward, observer } = this.opQueue[0]

    this.isFirstItemBeingProcessed = true

    const onOperationDone = () => {
      this.opQueue = this.opQueue.filter(item => item.operation !== operation)
      this.isFirstItemBeingProcessed = false
      this.persistQueue()
      this.continueWithTheQueue()
    }

    forward(operation)
      .subscribe({
        next: (v) => {
          observer.next && observer.next(v)
        },
        error: (e: Error) => {
          console.info(`[apolloLinkQueue] queue(${this.opQueue.length}) currentSubscription error`, e)
          observer.error && observer.error(e)
          onOperationDone()
        },
        complete: () => {
          console.info(`[apolloLinkQueue] queue(${this.opQueue.length}) currentSubscription complete`)
          observer.complete && observer.complete()
          onOperationDone()
        },
      });
  }

  protected persistQueue = () => {
    const mutations = this.opQueue
      .filter(item => getMainDefinition(item.operation.query).operation === 'mutation')
      .map((item) => {
        const { operation: { getContext, ...rest } } = item
        const { cache, client, ...contextRest } = getContext()

        return {
          context: contextRest,
          ...rest,
        }
      })

    localStorage.setItem('apollo-link-offline-queue', JSON.stringify(mutations))
  }

  public restoreQueue = (client: ApolloClient<any>) => {
    const json = localStorage.getItem('apollo-link-offline-queue')
    if (json) {
      const operations = JSON.parse(json) as any[]
      operations.forEach(({ query, variables, context }) => {
        client.mutate({ mutation: query, variables, context })
      })
    }
  }
}