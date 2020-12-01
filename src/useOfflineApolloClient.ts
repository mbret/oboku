import { ApolloClient, InMemoryCache, Reference, StoreValue, useApolloClient } from "@apollo/client";
import { Modifier } from "@apollo/client/cache/core/types/common";
import { useClient } from "./client";
import { App, Book, DataSource, Link, Query, QueryFieldPolicy, Collection, Tag, User } from "./generated/graphql";
import { NonMaybe } from "./types";

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


type ReferenceTypename =
  Collection['__typename']
  | Book['__typename']
  | DataSource['__typename']
  | App['__typename']
  | Tag['__typename']
  | User['__typename']

type ModifyableBook = Omit<Required<Book>, 'collections'> & {
  collections: Reference[]
}

type ModifyableTag = Omit<Required<Tag>, 'books'> & {
  books: Reference[]
}

type ModifyableCollection = Omit<Required<Collection>, 'books'> & {
  books: Reference[]
}

type ModifyableQuery = Omit<Required<Query>, 'books' | 'dataSources' | 'collections'> & {
  books: Reference[],
  collections: Reference[],
  dataSources: Reference[],
}

type ModifyableDataSource = Required<DataSource>
type ModifyableLink = NonMaybe<Link>

type ModifyEntity =
  ModifyableCollection
  | ModifyableBook
  | ModifyableQuery
  | ModifyableDataSource
  | ModifyableLink
  | App
  | ModifyableTag
  | User

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

  public modify(__typename: User['__typename'], options: OfflineModifyOption<User>): boolean
  public modify(__typename: App['__typename'], options: OfflineModifyOption<App>): boolean
  public modify(__typename: ModifyableTag['__typename'], options: OfflineModifyOption<ModifyableTag>): boolean
  public modify(__typename: ModifyableCollection['__typename'], options: OfflineModifyOption<ModifyableCollection>): boolean
  public modify(__typename: ModifyableQuery['__typename'], options: OfflineModifyOption<ModifyableQuery>): boolean
  public modify(__typename: ModifyableDataSource['__typename'], options: OfflineModifyOption<ModifyableDataSource>): boolean
  public modify(__typename: ModifyableLink['__typename'], options: OfflineModifyOption<ModifyableLink>): boolean
  public modify(__typename: ModifyableBook['__typename'], options: OfflineModifyOption<ModifyableBook>): boolean
  public modify<Entity extends ModifyEntity>(__typename: Entity['__typename'], options: OfflineModifyOption<Entity>) {
    return this.cache.modify(options)
  }
}

export const useOfflineApolloClient = () => useApolloClient() as NonNullable<ReturnType<typeof useClient>>