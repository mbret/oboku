import { ApolloClient, InMemoryCache, Reference, StoreValue, useApolloClient } from "@apollo/client";
import { Modifier } from "@apollo/client/cache/core/types/common";
import { useClient } from "./client";
import { Book, DataSource, Link, Query, QueryFieldPolicy, Series } from "./generated/graphql";

type MyCache = InMemoryCache & { foo: () => void }

const getCacheWrapper = (originalCache: InMemoryCache) => {
  type EvictOptions = Parameters<typeof originalCache.evict>[0]
  // fieldName: keyof QueryFieldPolicy, args
  (originalCache as any).evictRootQuery = (options: Omit<EvictOptions, 'id' | 'fieldName'> & { fieldName: keyof QueryFieldPolicy }) => {
    return originalCache.evict({ id: 'ROOT_QUERY', ...options })
  }

  return originalCache as MyCache
}

type EvictOptions = Parameters<InMemoryCache['evict']>[0]
type ModifyOptions = Parameters<InMemoryCache['modify']>[0]


type ReferenceTypename = Series['__typename'] | Book['__typename'] | DataSource['__typename']

type ModifyableBook = Omit<Required<Book>, 'series'> & {
  series: Reference[]
}

type ModifyableSeries = Omit<Required<Series>, 'books'> & {
  books: Reference[]
}

type ModifyableQuery = Omit<Required<Query>, 'books' | 'dataSources'> & {
  books: Reference[],
  dataSources: Reference[],
}

type ModifyableDataSource = Required<DataSource>
type ModifyableLink = Required<Link>

type ModifyEntity = ModifyableSeries | ModifyableBook | ModifyableQuery | ModifyableDataSource | ModifyableLink

type OfflineModifyOption<Entity> = Omit<ModifyOptions, 'fields'> & {
  fields: {
    [K in keyof Partial<Entity>]: Modifier<Entity[K]>
  }
}

export class OfflineApolloClient<TCacheShape> extends ApolloClient<TCacheShape> {
  public evictRootQuery = <Field extends keyof QueryFieldPolicy>(options: Omit<EvictOptions, 'id' | 'fieldName'> & {
    fieldName: Field,
  }) => {
    return this.cache.evict(options)
  }

  public identify = <R extends ReferenceTypename>(
    object: {
      __typename?: R
      [storeFieldName: string]: StoreValue
    } | Reference
  ) => {
    return this.cache.identify(object)
  }

  public modify(__typename: ModifyableSeries['__typename'], options: OfflineModifyOption<ModifyableSeries>): boolean
  public modify(__typename: ModifyableBook['__typename'], options: OfflineModifyOption<ModifyableBook>): boolean
  public modify(__typename: ModifyableQuery['__typename'], options: OfflineModifyOption<ModifyableQuery>): boolean
  public modify(__typename: ModifyableDataSource['__typename'], options: OfflineModifyOption<ModifyableDataSource>): boolean
  public modify(__typename: ModifyableLink['__typename'], options: OfflineModifyOption<ModifyableLink>): boolean
  public modify<Entity extends ModifyEntity>(__typename: Entity['__typename'], options: OfflineModifyOption<Entity>) {
    return this.cache.modify(options)
  }
}

export const useOfflineApolloClient = () => useApolloClient() as NonNullable<ReturnType<typeof useClient>>