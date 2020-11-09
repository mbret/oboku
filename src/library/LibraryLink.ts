import { ApolloLink, FetchResult } from "apollo-link"
import { ApolloClient } from "@apollo/client"
import { getMainDefinition } from "../utils"
import { QuerySync, QuerySyncData } from "./queries"

class LibraryLink extends ApolloLink {
  public request = (operation, forward) => {
    const context = operation.getContext()
    const definition = getMainDefinition(operation.query)
    const client = context.client as ApolloClient<any>

    return forward(operation)
  }

  public init = async (client: ApolloClient<any>) => {
    let data: QuerySyncData | null | undefined
    try {
      data = client.readQuery<QuerySyncData>({ query: QuerySync })
    } catch (e) { }

    if (!data) {
      client.writeQuery<QuerySyncData>({ query: QuerySync, data: { sync: { happening: false } } })
    }
  }
}

export const libraryLink = new LibraryLink()