import { generateUniqueID } from "../utils";
import { ApolloClient } from "@apollo/client";
import { GET_ONE_SERIES, GET_ONE_SERIES_VARIABLES, GET_ONE_SERIES_DATA } from "./queries";
import { MutationEditSeriesArgs, MutationRemoveSeriesArgs } from "../generated/graphql";

export declare type IResolverObject<TContext = any, TArgs = any> = {
  [key: string]: IFieldResolver<TContext, TArgs>
};

export type IFieldResolver<TContext, TArgs = Record<string, any>> = (args: TArgs, context: TContext) => any;

type ResolverContext = { client: ApolloClient<any> }

export const seriesOfflineResolvers = {
  Mutation: {
    addSeries: (variables: { name: string }, { client }: ResolverContext) => {
      const series = {
        __typename: 'Series' as const,
        id: generateUniqueID(),
        books: [],
        ...variables,
      }

      // create the offline item reference
      client.cache.writeQuery<GET_ONE_SERIES_DATA, GET_ONE_SERIES_VARIABLES>({
        query: GET_ONE_SERIES,
        variables: { id: series.id },
        data: { oneSeries: series },
      })
      // add the offline item to the list
      client.cache.modify({
        fields: {
          series: (prev = [], { toReference }) => {
            return [...prev, toReference(series)]
          }
        }
      })

      return series
    },
    removeSeries: ({ id }: MutationRemoveSeriesArgs, { client }: ResolverContext) => {
      const item = client.cache.identify({ id, __typename: 'Series' })
      item && client.cache.evict({ id: item })
    },
    editSeries: ({ id, name }: MutationEditSeriesArgs, { client }: ResolverContext) => {
      client.cache.modify({
        id: client.cache.identify({ id, __typename: 'Series' }),
        fields: {
          name: (prev) => name || prev,
        }
      })
    },
  },
}