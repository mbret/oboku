import { MutationEditCollectionArgs, MutationRemoveCollectionArgs, QueryCollectionIdsDocument } from "../generated/graphql";
import { useClient } from "../client";

export declare type IResolverObject<TContext = any, TArgs = any> = {
  [key: string]: IFieldResolver<TContext, TArgs>
};

export type IFieldResolver<TContext, TArgs = Record<string, any>> = (args: TArgs, context: TContext) => any;

type ResolverContext = { client: NonNullable<ReturnType<typeof useClient>> }

export const collectionOfflineResolvers = {
  Mutation: {
    removeCollection: ({ id }: MutationRemoveCollectionArgs, { client }: ResolverContext) => {
      const normalizedId = client.cache.identify({ id, __typename: 'Collection' })
      if (normalizedId) {
        client.cache.evict({ id: normalizedId })
        client.evictRootQuery({ fieldName: 'collection', args: { id } })
        const data = client.readQuery({ query: QueryCollectionIdsDocument })
        data && client.writeQuery({ query: QueryCollectionIdsDocument, data: { collections: data?.collections?.filter(item => item?.id !== id) } })
      }
    },
    editCollection: ({ id, name }: MutationEditCollectionArgs, { client }: ResolverContext) => {
      client.cache.modify({
        id: client.cache.identify({ id, __typename: 'Collection' }),
        fields: {
          name: (prev) => name || prev,
        }
      })
    },
  },
}