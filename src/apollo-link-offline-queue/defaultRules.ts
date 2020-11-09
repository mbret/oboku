import { OperationQueueEntry } from "../apollo-link-offline-queue/types";
import * as R from 'ramda'

export const defaultRules = (queue: OperationQueueEntry[], newEntry: OperationQueueEntry): OperationQueueEntry[] => {
  /**
   * Remove duplicate operations
   */
  const duplicatedOperation = queue.find(item =>
    item !== newEntry
    && item.operation.operationName === newEntry.operation.operationName
    && R.equals(item.operation.variables, newEntry.operation.variables)
  )

  if (duplicatedOperation) {
    return queue.filter(item => item !== newEntry)
  }

  return queue
}