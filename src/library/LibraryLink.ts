import { ApolloLink } from "apollo-link"
import { QueryInitSyncStateDocument } from "../generated/graphql"
import { OfflineApolloClient } from "../useOfflineApolloClient"

class LibraryLink extends ApolloLink {
  public request = (operation, forward) => {

    return forward(operation)
  }

  public init = async (client: OfflineApolloClient<any>) => {
    this.initializeState(client)
    this.resetState(client)
  }

  protected initializeState = async (client: OfflineApolloClient<any>) => {
    let data
      try { data = client.readQuery({ query: QueryInitSyncStateDocument }) } catch (e) { }

      if (!data) {
        client.writeQuery({
          query: QueryInitSyncStateDocument,
          data: {
            syncState: { __typename: 'SyncQueryResponse' }
          }
        })
      }
  }

  protected resetState = async (client: OfflineApolloClient<any>) => {
    client.modify('Query', {
      fields: {
        syncState: (value) => ({ ...value, happening: false })
      }
    })
  }
}

export const libraryLink = new LibraryLink()