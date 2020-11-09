import { OperationQueueEntry } from "../apollo-link-offline-queue/types";
import { MutationRemoveBook, MutationAddBook } from "../books/queries";

/**
 * @IMPORTANT
 * The function needs to be sync
 * We can only remove items from the list for now
 * @todo 
 * - handle async rule function
 * - add new operation at any place in the list
 * - replace operation (remove and then add)
 */
export const rules = (queue: OperationQueueEntry[], newEntry: OperationQueueEntry): OperationQueueEntry[] => {
  switch (newEntry.operation.operationName) {
    /**
     * @case 
     * We try to remove a book that we already want to add before
     * 
     * @result
     * we remove both mutation
     * 
     * @todo
     * remove any edit mutation too
     */
    case MutationRemoveBook.name: {
      const addMutation = queue.find(entry =>
        entry.operation.operationName === MutationAddBook.name
        && entry.operation.variables?.id === newEntry.operation.variables?.id
      )

      console.warn('REMOVED')

      if (addMutation) {
        return queue.filter(entry =>
          entry !== addMutation
          && entry !== newEntry
        )
      }

      return queue
    }
    default: return queue
  }
}