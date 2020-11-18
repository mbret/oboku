import { ApolloLink, NextLink, Operation } from "apollo-link"
import { OfflineApolloClient } from "../client"
import { Add_SeriesDocument, NewSeriesFragmentDoc } from "../generated/graphql"
import { forOperationAs } from "../utils"

class SeriesLink extends ApolloLink {
  public request = (operation: Operation, forward: NextLink) => {
    const context = operation.getContext()
    const client = context.client as OfflineApolloClient<any>

    /**
     * Add the new series into cache + list of series
     */
    forOperationAs(operation, Add_SeriesDocument, ({ variables }) => {
      const ref = client.cache.writeFragment({
        data: {
          __typename: 'Series',
          ...variables,
        },
        fragment: NewSeriesFragmentDoc
      });
      client.modify('Query', {
        fields: {
          series: (prev = []) => {
            if (ref) return [...prev, ref]
            return prev
          }
        }
      })
    })

    return forward(operation)
  }
}

export const seriesLink = new SeriesLink()