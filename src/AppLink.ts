import { ApolloLink, NextLink, Operation } from "apollo-link"
import { OfflineApolloClient } from "./client"
import { FragmentInitAppFragmentDoc } from "./generated/graphql"

class AppLink extends ApolloLink {
  protected client: OfflineApolloClient<any> | undefined

  public request = (operation: Operation, forward: NextLink) => {

    return forward(operation)
  }

  init = async (client: OfflineApolloClient<any>) => {
    this.client = client

    const ref = client.identify({ __typename: 'App', id: '_' })
    let fragment
    try {
      fragment = client.readFragment({ fragment: FragmentInitAppFragmentDoc, id: ref })
    } catch (_) { }
    if (!fragment) {
      client.writeFragment({
        fragment: FragmentInitAppFragmentDoc,
        data: { id: '_', hasUpdateAvailable: false, __typename: 'App' }
      })
    }
    client.modify('App', {
      id: ref,
      fields: {
        hasUpdateAvailable: _ => false,
      }
    })
  }
}

export const appLink = new AppLink()