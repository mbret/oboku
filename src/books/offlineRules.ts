import { OperationQueueEntry } from "../apollo-link-offline-queue/types";
import { AddBookDocument, RemoveBookDocument } from "../generated/graphql";
import { forOperationAs, isSameOperation } from "../utils";

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
  if (isSameOperation(newEntry.operation.query, RemoveBookDocument)) {
    const addMutation = queue.find(entry =>
      isSameOperation(entry.operation.query, AddBookDocument)
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

  return queue
}