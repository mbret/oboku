import { generateUniqueID } from "../utils";
import { ApolloClient } from "@apollo/client";
import { QueryTag, QueryTagData } from "./queries";
import { QueryTagArgs, Tag } from "../generated/graphql";

export declare type IResolverObject<TContext = any, TArgs = any> = {
  [key: string]: IFieldResolver<TContext, TArgs>
};

export type IFieldResolver<TContext, TArgs = Record<string, any>> = (args: TArgs, context: TContext) => any;

type ResolverContext = { client: ApolloClient<any> }

export const tagsOfflineResolvers = {
  Mutation: {
    addTag: (variables: { name: string }, { client }: ResolverContext) => {
      const tag: Required<Tag> = {
        __typename: 'Tag' as const,
        id: generateUniqueID(),
        books: [],
        isProtected: false,
        ...variables,
      }

      // create the offline tag reference
      client.cache.writeQuery({ query: QueryTag, variables: { id: tag.id }, data: { tag } })
      // add the offline tag to the list
      client.cache.modify({
        fields: {
          tags: (prev = [], { toReference }) => {
            return [...prev, toReference(tag)]
          }
        }
      })

      return tag
    },
    removeTag: ({ id }: { id: string }, { client }: ResolverContext) => {
      const item = client.cache.identify({ id, __typename: 'Tag' })
      item && client.cache.evict({ id: item })
    },
    editTag: ({ id, ...rest }: { id: string }, { client }: ResolverContext) => {
      const data = client.readQuery<QueryTagData, QueryTagArgs>({ query: QueryTag, variables: { id } })
      data && client.writeQuery<QueryTagData, QueryTagArgs>({
        query: QueryTag, variables: { id }, data: {
          tag: {
            ...data.tag,
            ...rest,
          }
        }
      })
    },
  },
}