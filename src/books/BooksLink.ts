import { ApolloLink, NextLink, Operation } from "apollo-link"
import { forOperationAs } from "../utils"
import { Book, MutationAddSeriesToBookDocument, MutationRemoveSeriesToBookDocument, Series } from "../generated/graphql"
import { OfflineApolloClient } from "../client"
import { GET_BOOK, QueryGetBookData } from "../books/queries"
import { Reference } from "@apollo/client"

class BooksLink extends ApolloLink {
  public request = (operation: Operation, forward: NextLink) => {
    const context = operation.getContext()
    const client = context.client as OfflineApolloClient<any>

    forOperationAs(operation, MutationAddSeriesToBookDocument, ({ variables }) => {
      const bookRefId = client.identify({ __typename: 'Book', id: variables?.id })
      if (variables) {
        const bookData = client.readQuery<QueryGetBookData>({ query: GET_BOOK, variables: { id: variables.id } })
        const series = variables.series.map(item => ({ __typename: 'Series' as const, id: item || '-1' }))
        if (bookData) {
          client.writeQuery<QueryGetBookData>({
            query: GET_BOOK, variables: { id: variables.id }, data: {
              book: {
                ...bookData.book,
                series: [...bookData.book.series || [], ...series]
              }
            }
          })
        }
        variables.series.forEach(seriesId => {
          const seriesRefId = client.identify({ __typename: 'Series', id: seriesId })
          seriesRefId && bookRefId && client.modify<Series>({
            id: seriesRefId,
            fields: {
              books: (existing, { toReference }) => [...existing || [], toReference(bookRefId)]
            }
          })
        })
      }
    })

    forOperationAs(operation, MutationRemoveSeriesToBookDocument, ({ variables }) => {
      const bookRefId = client.identify({ __typename: 'Book', id: variables?.id })
      const seriesReferences = variables?.series.map(id => client.identify({ __typename: 'Series', id })) || []

      if (bookRefId) {
        client.modify<Book>({
          id: bookRefId,
          fields: {
            series: (existing: Reference[]) => existing.filter(item => !seriesReferences.includes(item.__ref))
          }
        })
        seriesReferences.forEach(seriesRefId => {
          seriesRefId && client.modify<Series>({
            id: seriesRefId,
            fields: {
              books: (existing: Reference[]) => existing.filter(item => item.__ref !== bookRefId)
            }
          })
        })
      }
    })

    return forward(operation)
  }
}

export const booksLink = new BooksLink()