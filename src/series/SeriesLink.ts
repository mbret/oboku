import { ApolloLink, NextLink, Operation } from "apollo-link"

class SeriesLink extends ApolloLink {
  public request = (operation: Operation, forward: NextLink) => {

    return forward(operation)
  }
}

export const seriesLink = new SeriesLink()