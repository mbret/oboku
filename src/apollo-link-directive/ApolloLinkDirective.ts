import {
  ApolloLink,
  Operation,
  NextLink,
} from '@apollo/client/link/core';
import {
  RemoveDirectiveConfig, removeDirectivesFromDocument,
} from '@apollo/client/utilities';

export class ApolloLinkDirective extends ApolloLink {
  protected directives: RemoveDirectiveConfig[]

  constructor(directives: RemoveDirectiveConfig[]) {
    super()
    this.directives = directives
  }

  public request(operation: Operation, forward: NextLink) {
    const cleanedQuery = removeDirectivesFromDocument(this.directives, operation.query)

    if (cleanedQuery) {
      operation.query = cleanedQuery
    }

    return forward(operation)
  }
}