import { ApolloLink, NextLink, Operation } from "apollo-link"
import { OfflineApolloClient } from "../client"
import { Add_CollectionDocument, NewCollectionFragmentDoc } from "../generated/graphql"
import { forOperationAs } from "../utils"

class CollectionLink extends ApolloLink {
  public request = (operation: Operation, forward: NextLink) => {
    const context = operation.getContext()
    const client = context.client as OfflineApolloClient<any>

    /**
     * Add the new collection into cache + list of collection
     */
    forOperationAs(operation, Add_CollectionDocument, ({ variables }) => {
      const ref = client.cache.writeFragment({
        data: {
          __typename: 'Collection',
          ...variables,
        },
        fragment: NewCollectionFragmentDoc
      });
      client.modify('Query', {
        fields: {
          collections: (prev = []) => {
            if (ref) return [...prev, ref]
            return prev
          }
        }
      })
    })

    return forward(operation)
  }
}

export const collectionLink = new CollectionLink()