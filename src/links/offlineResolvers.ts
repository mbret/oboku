import { MutationEditLinkArgs, MutationAddLinkArgs, Link } from '../generated/graphql'
import { ApolloClient, gql } from "@apollo/client";
import { generateUniqueID } from "../utils";
import { QueryFullLink } from "./queries";

type ResolverContext = { client: ApolloClient<any> }

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
    addLink: ({ bookId, ...rest }: Omit<MutationAddLinkArgs, 'id'> & { bookId: string }, { client }: ResolverContext) => {
      const link: Required<Link> = {
        __typename: 'Link' as const,
        id: generateUniqueID(),
        location: rest.location,
      }

      // create normalized reference + prepare link() query
      client.writeQuery({ query: QueryFullLink, variables: { id: link.id }, data: { link: link } })

      // Add link to book
      const data = client.readQuery({ query: QueryBookLinks, variables: { id: bookId } })
      client.writeQuery({
        query: QueryBookLinks,
        variables: { id: bookId },
        data: { book: { ...data.book, links: [...data.book.links, link] } }
      })

      return link
    },
    editLink: ({ id, bookId, ...rest }: MutationEditLinkArgs & { bookId: string }, { client }: ResolverContext) => {
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

      client.cache.modify({
        id: itemId,
        fields: {
          location: (prev) => rest.location !== undefined ? rest.location : prev,
        }
      })
    },
  },
}