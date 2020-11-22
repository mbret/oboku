import { MutationAddLinkDocument, MutationEditLinkDocument, QueryFullLinkDocument } from '../generated/graphql'
import { gql } from "@apollo/client";
import { generateUniqueID } from "../utils";
import { OfflineApolloClient } from '../client';

type ResolverContext = { client: OfflineApolloClient<any> }

export const QueryBookLinks = gql`
  query QueryBookLinks($id: ID!) {
    book(id: $id) {
      id
      links {
        id
      }
    }
  }
`

export const linkOfflineResolvers = {
  Mutation: {
    addLink: ({ bookId, ...rest }: Omit<NonNullable<typeof MutationAddLinkDocument['__variablesType']>, 'id'> & { bookId: string }, { client }: ResolverContext) => {
      const link = {
        __typename: 'Link' as const,
        id: generateUniqueID(),
        data: '',
        ...rest,
      }

      // create normalized reference + prepare link() query
      client.writeQuery({ query: QueryFullLinkDocument, variables: { id: link.id }, data: { link: link } })

      // Add link to book
      const data = client.readQuery({ query: QueryBookLinks, variables: { id: bookId } })
      client.writeQuery({
        query: QueryBookLinks,
        variables: { id: bookId },
        data: { book: { ...data.book, links: [...data.book.links, link] } }
      })

      return link
    },
    editLink: ({ id, bookId, ...rest }: NonNullable<typeof MutationEditLinkDocument['__variablesType']> & { bookId: string }, { client }: ResolverContext) => {
      const itemId = client.cache.identify({ id, __typename: 'Link' })
      const bookItemId = client.cache.identify({ id: bookId, __typename: 'Book' })

      if (!itemId) return

      if (bookItemId) {
        client.cache.modify({
          id: bookItemId,
          fields: {
            lastMetadataUpdatedAt: () => null,
          }
        })
      }

      client.modify('Link', {
        id: itemId,
        fields: {
          resourceId: (prev) => rest.resourceId !== undefined ? rest.resourceId : prev,
        }
      })
    },
  },
}