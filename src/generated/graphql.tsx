import { FieldPolicy, FieldReadFunction, TypePolicies } from '@apollo/client/cache';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type User = {
  __typename?: 'User';
  contentPassword?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isLibraryUnlocked: Scalars['Boolean'];
};

export type Book = {
  __typename?: 'Book';
  collections?: Maybe<Array<Maybe<Collection>>>;
  createdAt?: Maybe<Scalars['Float']>;
  creator?: Maybe<Scalars['String']>;
  date?: Maybe<Scalars['Float']>;
  downloadProgress?: Maybe<Scalars['Float']>;
  downloadState?: Maybe<DownloadState>;
  id: Scalars['ID'];
  language?: Maybe<Scalars['String']>;
  lastMetadataUpdatedAt?: Maybe<Scalars['Float']>;
  links?: Maybe<Array<Maybe<Link>>>;
  publisher?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkLocation?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkProgressPercent?: Maybe<Scalars['Float']>;
  readingStateCurrentBookmarkProgressUpdatedAt?: Maybe<Scalars['Float']>;
  rights?: Maybe<Scalars['String']>;
  subject?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  title?: Maybe<Scalars['String']>;
};

export enum LinkType {
  Uri = 'URI',
  Drive = 'DRIVE'
}

export type Link = {
  __typename?: 'Link';
  id: Scalars['ID'];
  type?: Maybe<LinkType>;
  resourceId?: Maybe<Scalars['String']>;
  data?: Maybe<Scalars['String']>;
};

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  books?: Maybe<Array<Maybe<Book>>>;
  isProtected?: Maybe<Scalars['Boolean']>;
};

export type Collection = {
  __typename?: 'Collection';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  books?: Maybe<Array<Maybe<Book>>>;
};

export enum DataSourceType {
  Drive = 'DRIVE'
}

export type DataSource = {
  __typename?: 'DataSource';
  id: Scalars['ID'];
  type?: Maybe<DataSourceType>;
  lastSyncedAt?: Maybe<Scalars['Float']>;
  data?: Maybe<Scalars['String']>;
};

export type SyncQueryResponse = {
  __typename?: 'SyncQueryResponse';
  books?: Maybe<Array<Maybe<Book>>>;
  dataSources?: Maybe<Array<Maybe<DataSource>>>;
  happening: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  app?: Maybe<App>;
  auth?: Maybe<Auth>;
  book?: Maybe<Book>;
  books?: Maybe<Array<Maybe<Book>>>;
  collection?: Maybe<Collection>;
  collections?: Maybe<Array<Maybe<Collection>>>;
  dataSource?: Maybe<DataSource>;
  dataSources?: Maybe<Array<Maybe<DataSource>>>;
  firstTimeExperience?: Maybe<FirstTimeExperience>;
  links?: Maybe<Array<Maybe<Link>>>;
  syncState?: Maybe<SyncQueryResponse>;
  tag?: Maybe<Tag>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  user?: Maybe<User>;
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};


export type QueryBooksArgs = {
  isProtected?: Maybe<Scalars['Boolean']>;
};


export type QueryCollectionArgs = {
  id: Scalars['ID'];
};


export type QueryCollectionsArgs = {
  foo?: Maybe<Scalars['String']>;
};


export type QueryTagArgs = {
  id: Scalars['ID'];
};

export type MutationResponse = {
  __typename?: 'MutationResponse';
  success?: Maybe<Scalars['Boolean']>;
};

export type AuthenticationResponse = {
  __typename?: 'AuthenticationResponse';
  token: Scalars['String'];
  user: User;
};

export type Mutation = {
  __typename?: 'Mutation';
  addBook?: Maybe<MutationResponse>;
  addCollection?: Maybe<Collection>;
  addCollectionsToBook?: Maybe<MutationResponse>;
  addDataSource?: Maybe<DataSource>;
  addLink?: Maybe<MutationResponse>;
  addTag?: Maybe<Tag>;
  addTagsToBook?: Maybe<MutationResponse>;
  app?: Maybe<App>;
  editBook?: Maybe<Book>;
  editCollection?: Maybe<Collection>;
  editLink?: Maybe<MutationResponse>;
  editTag?: Maybe<Tag>;
  editUser?: Maybe<User>;
  removeBook?: Maybe<Book>;
  removeCollection?: Maybe<MutationResponse>;
  removeCollectionsToBook?: Maybe<MutationResponse>;
  removeTag?: Maybe<MutationResponse>;
  removeTagsToBook?: Maybe<MutationResponse>;
  signin?: Maybe<AuthenticationResponse>;
  signup?: Maybe<AuthenticationResponse>;
  syncDataSource?: Maybe<MutationResponse>;
};


export type MutationAddBookArgs = {
  id: Scalars['ID'];
};


export type MutationAddCollectionArgs = {
  id: Scalars['ID'];
  name: Scalars['String'];
};


export type MutationAddCollectionsToBookArgs = {
  id: Scalars['ID'];
  collections?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationAddDataSourceArgs = {
  id: Scalars['ID'];
  type: DataSourceType;
  data: Scalars['String'];
};


export type MutationAddLinkArgs = {
  id: Scalars['ID'];
  bookId: Scalars['ID'];
  type: LinkType;
  resourceId: Scalars['String'];
};


export type MutationAddTagArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};


export type MutationAddTagsToBookArgs = {
  id: Scalars['ID'];
  tags?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationAppArgs = {
  hasUpdateAvailable?: Maybe<Scalars['Boolean']>;
};


export type MutationEditBookArgs = {
  id: Scalars['ID'];
  lastMetadataUpdatedAt?: Maybe<Scalars['Float']>;
  title?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkLocation?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkProgressPercent?: Maybe<Scalars['Float']>;
};


export type MutationEditCollectionArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};


export type MutationEditLinkArgs = {
  id: Scalars['ID'];
  type: LinkType;
  resourceId: Scalars['String'];
};


export type MutationEditTagArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  isProtected?: Maybe<Scalars['Boolean']>;
};


export type MutationEditUserArgs = {
  id: Scalars['ID'];
  contentPassword?: Maybe<Scalars['String']>;
};


export type MutationRemoveBookArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveCollectionArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveCollectionsToBookArgs = {
  id: Scalars['ID'];
  collections?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationRemoveTagArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveTagsToBookArgs = {
  id: Scalars['ID'];
  tags?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationSigninArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationSignupArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationSyncDataSourceArgs = {
  id: Scalars['ID'];
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}


export type FirstTimeExperience = {
  __typename?: 'FirstTimeExperience';
  hasDoneWelcomeTour?: Maybe<Scalars['Boolean']>;
  hasDoneReaderTour?: Maybe<Scalars['Boolean']>;
};

export enum DownloadState {
  None = 'none',
  Downloaded = 'downloaded',
  Downloading = 'downloading'
}

export type Auth = {
  __typename?: 'Auth';
  token?: Maybe<Scalars['String']>;
  isAuthenticated: Scalars['Boolean'];
};

export type App = {
  __typename?: 'App';
  id: Scalars['ID'];
  hasUpdateAvailable: Scalars['Boolean'];
};

export type QueryAuthQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryAuthQuery = (
  { __typename?: 'Query' }
  & { auth?: Maybe<(
    { __typename?: 'Auth' }
    & Pick<Auth, 'token' | 'isAuthenticated'>
  )> }
);

export type QueryUserIsLibraryProtectedQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryUserIsLibraryProtectedQuery = (
  { __typename?: 'Query' }
  & { user?: Maybe<(
    { __typename?: 'User' }
    & Pick<User, 'isLibraryUnlocked'>
  )> }
);

export type BookDetailsFragment = (
  { __typename: 'Book' }
  & Pick<Book, 'id' | 'lastMetadataUpdatedAt' | 'title' | 'creator' | 'language' | 'date' | 'publisher' | 'subject' | 'downloadState' | 'downloadProgress' | 'readingStateCurrentBookmarkLocation' | 'readingStateCurrentBookmarkProgressUpdatedAt' | 'readingStateCurrentBookmarkProgressPercent' | 'createdAt'>
);

export type BookDetailsWithAssociationsFragment = (
  { __typename?: 'Book' }
  & { tags?: Maybe<Array<Maybe<(
    { __typename?: 'Tag' }
    & Pick<Tag, 'id' | 'name' | 'isProtected'>
  )>>>, links?: Maybe<Array<Maybe<(
    { __typename?: 'Link' }
    & Pick<Link, 'id' | 'resourceId'>
  )>>>, collections?: Maybe<Array<Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
  )>>> }
  & BookDetailsFragment
);

export type MutationAddCollectionsToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  collections: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationAddCollectionsToBookMutation = (
  { __typename?: 'Mutation' }
  & { addCollectionsToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type MutationRemoveCollectionsToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  collections: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationRemoveCollectionsToBookMutation = (
  { __typename?: 'Mutation' }
  & { removeCollectionsToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type AddBookMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type AddBookMutation = (
  { __typename?: 'Mutation' }
  & { addBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type Edit_BookMutationVariables = Exact<{
  id: Scalars['ID'];
  lastMetadataUpdatedAt?: Maybe<Scalars['Float']>;
  readingStateCurrentBookmarkLocation?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkProgressPercent?: Maybe<Scalars['Float']>;
}>;


export type Edit_BookMutation = (
  { __typename?: 'Mutation' }
  & { editBook?: Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id'>
  )> }
);

export type RemoveBookMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type RemoveBookMutation = (
  { __typename?: 'Mutation' }
  & { removeBook?: Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id'>
  )> }
);

export type MutationAddTagsToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  tags: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationAddTagsToBookMutation = (
  { __typename?: 'Mutation' }
  & { addTagsToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type MutationRemoveTagsToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  tags: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationRemoveTagsToBookMutation = (
  { __typename?: 'Mutation' }
  & { removeTagsToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type QueryBookIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryBookIdsQuery = (
  { __typename?: 'Query' }
  & { books?: Maybe<Array<Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id'>
  )>>> }
);

export type QueryBooksQueryVariables = Exact<{
  isProtected?: Maybe<Scalars['Boolean']>;
}>;


export type QueryBooksQuery = (
  { __typename?: 'Query' }
  & { books?: Maybe<Array<Maybe<(
    { __typename?: 'Book' }
    & BookDetailsWithAssociationsFragment
  )>>> }
);

export type QueryBooksDownloadStateQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryBooksDownloadStateQuery = (
  { __typename?: 'Query' }
  & { books?: Maybe<Array<Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id' | 'downloadState'>
  )>>> }
);

export type QueryBookQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type QueryBookQuery = (
  { __typename?: 'Query' }
  & { book?: Maybe<(
    { __typename?: 'Book' }
    & BookDetailsWithAssociationsFragment
  )> }
);

export type QueryBooksSyncStateQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryBooksSyncStateQuery = (
  { __typename?: 'Query' }
  & { syncState?: Maybe<(
    { __typename?: 'SyncQueryResponse' }
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id' | 'title' | 'creator' | 'lastMetadataUpdatedAt'>
    )>>> }
  )> }
);

export type QuerySyncTriggerBooksPropertiesQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySyncTriggerBooksPropertiesQuery = (
  { __typename?: 'Query' }
  & { books?: Maybe<Array<Maybe<(
    { __typename?: 'Book' }
    & Pick<Book, 'id' | 'lastMetadataUpdatedAt'>
  )>>> }
);

export type NewCollectionFragment = (
  { __typename: 'Collection' }
  & Pick<Collection, 'id' | 'name'>
);

export type Add_CollectionMutationVariables = Exact<{
  id: Scalars['ID'];
  name: Scalars['String'];
}>;


export type Add_CollectionMutation = (
  { __typename?: 'Mutation' }
  & { addCollection?: Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
  )> }
);

export type Edit_CollectionMutationVariables = Exact<{
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
}>;


export type Edit_CollectionMutation = (
  { __typename?: 'Mutation' }
  & { editCollection?: Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
  )> }
);

export type Remove_CollectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type Remove_CollectionMutation = (
  { __typename?: 'Mutation' }
  & { removeCollection?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type QueryCollectionIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryCollectionIdsQuery = (
  { __typename?: 'Query' }
  & { collections?: Maybe<Array<Maybe<(
    { __typename: 'Collection' }
    & Pick<Collection, 'id'>
  )>>> }
);

export type Get_CollectionsQueryVariables = Exact<{
  foo?: Maybe<Scalars['String']>;
}>;


export type Get_CollectionsQuery = (
  { __typename?: 'Query' }
  & { collections?: Maybe<Array<Maybe<(
    { __typename: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )>>> }
);

export type QueryCollectionBookIdsQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type QueryCollectionBookIdsQuery = (
  { __typename?: 'Query' }
  & { collection?: Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )> }
);

export type Query_Collection_QueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type Query_Collection_Query = (
  { __typename?: 'Query' }
  & { collection?: Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )> }
);

export type MutationAddDataSourceMutationVariables = Exact<{
  id: Scalars['ID'];
  type: DataSourceType;
  data: Scalars['String'];
}>;


export type MutationAddDataSourceMutation = (
  { __typename?: 'Mutation' }
  & { addDataSource?: Maybe<(
    { __typename: 'DataSource' }
    & Pick<DataSource, 'id' | 'type' | 'data' | 'lastSyncedAt'>
  )> }
);

export type MutationSyncDataSourceMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type MutationSyncDataSourceMutation = (
  { __typename?: 'Mutation' }
  & { syncDataSource?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type QueryDataSourcesIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryDataSourcesIdsQuery = (
  { __typename?: 'Query' }
  & { dataSources?: Maybe<Array<Maybe<(
    { __typename?: 'DataSource' }
    & Pick<DataSource, 'id'>
  )>>> }
);

export type QueryDataSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryDataSourcesQuery = (
  { __typename?: 'Query' }
  & { dataSources?: Maybe<Array<Maybe<(
    { __typename?: 'DataSource' }
    & Pick<DataSource, 'id' | 'type' | 'data' | 'lastSyncedAt'>
  )>>> }
);

export type QueryDataSourceIdQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryDataSourceIdQuery = (
  { __typename?: 'Query' }
  & { dataSource?: Maybe<(
    { __typename?: 'DataSource' }
    & Pick<DataSource, 'id'>
  )> }
);

export type QuerySyncableDataSourcePropertiesQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySyncableDataSourcePropertiesQuery = (
  { __typename?: 'Query' }
  & { dataSources?: Maybe<Array<Maybe<(
    { __typename?: 'DataSource' }
    & Pick<DataSource, 'id' | 'lastSyncedAt'>
  )>>> }
);

export type QueryDataSourcesSyncStateQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryDataSourcesSyncStateQuery = (
  { __typename?: 'Query' }
  & { syncState?: Maybe<(
    { __typename?: 'SyncQueryResponse' }
    & { dataSources?: Maybe<Array<Maybe<(
      { __typename?: 'DataSource' }
      & Pick<DataSource, 'id' | 'lastSyncedAt'>
    )>>> }
  )> }
);

export type QueryFirstTimeExperienceQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryFirstTimeExperienceQuery = (
  { __typename?: 'Query' }
  & { firstTimeExperience?: Maybe<(
    { __typename?: 'FirstTimeExperience' }
    & Pick<FirstTimeExperience, 'hasDoneWelcomeTour' | 'hasDoneReaderTour'>
  )> }
);

export type FragmentInitAppFragment = (
  { __typename?: 'App' }
  & Pick<App, 'id' | 'hasUpdateAvailable'>
);

export type FragmentAppHasUpdateAvailableFragment = (
  { __typename?: 'App' }
  & Pick<App, 'hasUpdateAvailable'>
);

export type SyncLibraryQueryVariables = Exact<{ [key: string]: never; }>;


export type SyncLibraryQuery = (
  { __typename?: 'Query' }
  & { books?: Maybe<Array<Maybe<(
    { __typename?: 'Book' }
    & { tags?: Maybe<Array<Maybe<(
      { __typename?: 'Tag' }
      & Pick<Tag, 'id'>
    )>>>, links?: Maybe<Array<Maybe<(
      { __typename?: 'Link' }
      & Pick<Link, 'id'>
    )>>>, collections?: Maybe<Array<Maybe<(
      { __typename?: 'Collection' }
      & Pick<Collection, 'id'>
    )>>> }
    & BookDetailsFragment
  )>>>, tags?: Maybe<Array<Maybe<(
    { __typename?: 'Tag' }
    & Pick<Tag, 'id' | 'name' | 'isProtected'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )>>>, links?: Maybe<Array<Maybe<(
    { __typename?: 'Link' }
    & Pick<Link, 'id' | 'resourceId'>
  )>>>, collections?: Maybe<Array<Maybe<(
    { __typename?: 'Collection' }
    & Pick<Collection, 'id' | 'name'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )>>>, dataSources?: Maybe<Array<Maybe<(
    { __typename?: 'DataSource' }
    & Pick<DataSource, 'id' | 'type' | 'lastSyncedAt' | 'data'>
  )>>> }
);

export type QueryInitSyncStateQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryInitSyncStateQuery = (
  { __typename?: 'Query' }
  & { syncState?: Maybe<{ __typename: 'SyncQueryResponse' }> }
);

export type QuerySyncHappeningQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySyncHappeningQuery = (
  { __typename?: 'Query' }
  & { syncState?: Maybe<(
    { __typename?: 'SyncQueryResponse' }
    & Pick<SyncQueryResponse, 'happening'>
  )> }
);

export type MutationAddLinkMutationVariables = Exact<{
  id: Scalars['ID'];
  bookId: Scalars['ID'];
  resourceId: Scalars['String'];
  type: LinkType;
}>;


export type MutationAddLinkMutation = (
  { __typename?: 'Mutation' }
  & { addLink?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type MutationEditLinkMutationVariables = Exact<{
  id: Scalars['ID'];
  resourceId: Scalars['String'];
  type: LinkType;
}>;


export type MutationEditLinkMutation = (
  { __typename?: 'Mutation' }
  & { editLink?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type MutationAppMutationVariables = Exact<{
  hasUpdateAvailable?: Maybe<Scalars['Boolean']>;
}>;


export type MutationAppMutation = (
  { __typename?: 'Mutation' }
  & { app?: Maybe<(
    { __typename?: 'App' }
    & Pick<App, 'id' | 'hasUpdateAvailable'>
  )> }
);

export type QueryAppHasUpdateAvailableQueryVariables = Exact<{ [key: string]: never; }>;


export type QueryAppHasUpdateAvailableQuery = (
  { __typename?: 'Query' }
  & { app?: Maybe<(
    { __typename?: 'App' }
    & Pick<App, 'hasUpdateAvailable'>
  )> }
);

export type MutationRemoveTagMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type MutationRemoveTagMutation = (
  { __typename?: 'Mutation' }
  & { removeTag?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type UserKeySpecifier = ('contentPassword' | 'email' | 'id' | 'isLibraryUnlocked' | UserKeySpecifier)[];
export type UserFieldPolicy = {
	contentPassword?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	isLibraryUnlocked?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BookKeySpecifier = ('collections' | 'createdAt' | 'creator' | 'date' | 'downloadProgress' | 'downloadState' | 'id' | 'language' | 'lastMetadataUpdatedAt' | 'links' | 'publisher' | 'readingStateCurrentBookmarkLocation' | 'readingStateCurrentBookmarkProgressPercent' | 'readingStateCurrentBookmarkProgressUpdatedAt' | 'rights' | 'subject' | 'tags' | 'title' | BookKeySpecifier)[];
export type BookFieldPolicy = {
	collections?: FieldPolicy<any> | FieldReadFunction<any>,
	createdAt?: FieldPolicy<any> | FieldReadFunction<any>,
	creator?: FieldPolicy<any> | FieldReadFunction<any>,
	date?: FieldPolicy<any> | FieldReadFunction<any>,
	downloadProgress?: FieldPolicy<any> | FieldReadFunction<any>,
	downloadState?: FieldPolicy<any> | FieldReadFunction<any>,
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	language?: FieldPolicy<any> | FieldReadFunction<any>,
	lastMetadataUpdatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	links?: FieldPolicy<any> | FieldReadFunction<any>,
	publisher?: FieldPolicy<any> | FieldReadFunction<any>,
	readingStateCurrentBookmarkLocation?: FieldPolicy<any> | FieldReadFunction<any>,
	readingStateCurrentBookmarkProgressPercent?: FieldPolicy<any> | FieldReadFunction<any>,
	readingStateCurrentBookmarkProgressUpdatedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	rights?: FieldPolicy<any> | FieldReadFunction<any>,
	subject?: FieldPolicy<any> | FieldReadFunction<any>,
	tags?: FieldPolicy<any> | FieldReadFunction<any>,
	title?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LinkKeySpecifier = ('id' | 'type' | 'resourceId' | 'data' | LinkKeySpecifier)[];
export type LinkFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	resourceId?: FieldPolicy<any> | FieldReadFunction<any>,
	data?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TagKeySpecifier = ('id' | 'name' | 'books' | 'isProtected' | TagKeySpecifier)[];
export type TagFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>,
	isProtected?: FieldPolicy<any> | FieldReadFunction<any>
};
export type CollectionKeySpecifier = ('id' | 'name' | 'books' | CollectionKeySpecifier)[];
export type CollectionFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>
};
export type DataSourceKeySpecifier = ('id' | 'type' | 'lastSyncedAt' | 'data' | DataSourceKeySpecifier)[];
export type DataSourceFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	type?: FieldPolicy<any> | FieldReadFunction<any>,
	lastSyncedAt?: FieldPolicy<any> | FieldReadFunction<any>,
	data?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SyncQueryResponseKeySpecifier = ('books' | 'dataSources' | 'happening' | SyncQueryResponseKeySpecifier)[];
export type SyncQueryResponseFieldPolicy = {
	books?: FieldPolicy<any> | FieldReadFunction<any>,
	dataSources?: FieldPolicy<any> | FieldReadFunction<any>,
	happening?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QueryKeySpecifier = ('app' | 'auth' | 'book' | 'books' | 'collection' | 'collections' | 'dataSource' | 'dataSources' | 'firstTimeExperience' | 'links' | 'syncState' | 'tag' | 'tags' | 'user' | QueryKeySpecifier)[];
export type QueryFieldPolicy = {
	app?: FieldPolicy<any> | FieldReadFunction<any>,
	auth?: FieldPolicy<any> | FieldReadFunction<any>,
	book?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>,
	collection?: FieldPolicy<any> | FieldReadFunction<any>,
	collections?: FieldPolicy<any> | FieldReadFunction<any>,
	dataSource?: FieldPolicy<any> | FieldReadFunction<any>,
	dataSources?: FieldPolicy<any> | FieldReadFunction<any>,
	firstTimeExperience?: FieldPolicy<any> | FieldReadFunction<any>,
	links?: FieldPolicy<any> | FieldReadFunction<any>,
	syncState?: FieldPolicy<any> | FieldReadFunction<any>,
	tag?: FieldPolicy<any> | FieldReadFunction<any>,
	tags?: FieldPolicy<any> | FieldReadFunction<any>,
	user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type MutationResponseKeySpecifier = ('success' | MutationResponseKeySpecifier)[];
export type MutationResponseFieldPolicy = {
	success?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AuthenticationResponseKeySpecifier = ('token' | 'user' | AuthenticationResponseKeySpecifier)[];
export type AuthenticationResponseFieldPolicy = {
	token?: FieldPolicy<any> | FieldReadFunction<any>,
	user?: FieldPolicy<any> | FieldReadFunction<any>
};
export type MutationKeySpecifier = ('addBook' | 'addCollection' | 'addCollectionsToBook' | 'addDataSource' | 'addLink' | 'addTag' | 'addTagsToBook' | 'app' | 'editBook' | 'editCollection' | 'editLink' | 'editTag' | 'editUser' | 'removeBook' | 'removeCollection' | 'removeCollectionsToBook' | 'removeTag' | 'removeTagsToBook' | 'signin' | 'signup' | 'syncDataSource' | MutationKeySpecifier)[];
export type MutationFieldPolicy = {
	addBook?: FieldPolicy<any> | FieldReadFunction<any>,
	addCollection?: FieldPolicy<any> | FieldReadFunction<any>,
	addCollectionsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	addDataSource?: FieldPolicy<any> | FieldReadFunction<any>,
	addLink?: FieldPolicy<any> | FieldReadFunction<any>,
	addTag?: FieldPolicy<any> | FieldReadFunction<any>,
	addTagsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	app?: FieldPolicy<any> | FieldReadFunction<any>,
	editBook?: FieldPolicy<any> | FieldReadFunction<any>,
	editCollection?: FieldPolicy<any> | FieldReadFunction<any>,
	editLink?: FieldPolicy<any> | FieldReadFunction<any>,
	editTag?: FieldPolicy<any> | FieldReadFunction<any>,
	editUser?: FieldPolicy<any> | FieldReadFunction<any>,
	removeBook?: FieldPolicy<any> | FieldReadFunction<any>,
	removeCollection?: FieldPolicy<any> | FieldReadFunction<any>,
	removeCollectionsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	removeTag?: FieldPolicy<any> | FieldReadFunction<any>,
	removeTagsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	signin?: FieldPolicy<any> | FieldReadFunction<any>,
	signup?: FieldPolicy<any> | FieldReadFunction<any>,
	syncDataSource?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FirstTimeExperienceKeySpecifier = ('hasDoneWelcomeTour' | 'hasDoneReaderTour' | FirstTimeExperienceKeySpecifier)[];
export type FirstTimeExperienceFieldPolicy = {
	hasDoneWelcomeTour?: FieldPolicy<any> | FieldReadFunction<any>,
	hasDoneReaderTour?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AuthKeySpecifier = ('token' | 'isAuthenticated' | AuthKeySpecifier)[];
export type AuthFieldPolicy = {
	token?: FieldPolicy<any> | FieldReadFunction<any>,
	isAuthenticated?: FieldPolicy<any> | FieldReadFunction<any>
};
export type AppKeySpecifier = ('id' | 'hasUpdateAvailable' | AppKeySpecifier)[];
export type AppFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	hasUpdateAvailable?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TypedTypePolicies = TypePolicies & {
	User?: {
		keyFields?: false | UserKeySpecifier | (() => undefined | UserKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: UserFieldPolicy,
	},
	Book?: {
		keyFields?: false | BookKeySpecifier | (() => undefined | BookKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: BookFieldPolicy,
	},
	Link?: {
		keyFields?: false | LinkKeySpecifier | (() => undefined | LinkKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: LinkFieldPolicy,
	},
	Tag?: {
		keyFields?: false | TagKeySpecifier | (() => undefined | TagKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: TagFieldPolicy,
	},
	Collection?: {
		keyFields?: false | CollectionKeySpecifier | (() => undefined | CollectionKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: CollectionFieldPolicy,
	},
	DataSource?: {
		keyFields?: false | DataSourceKeySpecifier | (() => undefined | DataSourceKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: DataSourceFieldPolicy,
	},
	SyncQueryResponse?: {
		keyFields?: false | SyncQueryResponseKeySpecifier | (() => undefined | SyncQueryResponseKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: SyncQueryResponseFieldPolicy,
	},
	Query?: {
		keyFields?: false | QueryKeySpecifier | (() => undefined | QueryKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: QueryFieldPolicy,
	},
	MutationResponse?: {
		keyFields?: false | MutationResponseKeySpecifier | (() => undefined | MutationResponseKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: MutationResponseFieldPolicy,
	},
	AuthenticationResponse?: {
		keyFields?: false | AuthenticationResponseKeySpecifier | (() => undefined | AuthenticationResponseKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: AuthenticationResponseFieldPolicy,
	},
	Mutation?: {
		keyFields?: false | MutationKeySpecifier | (() => undefined | MutationKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: MutationFieldPolicy,
	},
	FirstTimeExperience?: {
		keyFields?: false | FirstTimeExperienceKeySpecifier | (() => undefined | FirstTimeExperienceKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: FirstTimeExperienceFieldPolicy,
	},
	Auth?: {
		keyFields?: false | AuthKeySpecifier | (() => undefined | AuthKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: AuthFieldPolicy,
	},
	App?: {
		keyFields?: false | AppKeySpecifier | (() => undefined | AppKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: AppFieldPolicy,
	}
};
export const BookDetailsFragmentDoc: DocumentNode<BookDetailsFragment, unknown> = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BookDetails"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Book"}},"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastMetadataUpdatedAt"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"title"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"creator"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"language"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"date"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"publisher"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"subject"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"downloadState"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]},{"kind":"Field","name":{"kind":"Name","value":"downloadProgress"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]},{"kind":"Field","name":{"kind":"Name","value":"readingStateCurrentBookmarkLocation"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"readingStateCurrentBookmarkProgressUpdatedAt"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"readingStateCurrentBookmarkProgressPercent"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"createdAt"},"arguments":[],"directives":[]}]}}]};
export const BookDetailsWithAssociationsFragmentDoc: DocumentNode<BookDetailsWithAssociationsFragment, unknown> = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BookDetailsWithAssociations"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Book"}},"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BookDetails"},"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"tags"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"isProtected"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"resourceId"},"arguments":[],"directives":[]}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}},...BookDetailsFragmentDoc.definitions]};
export const NewCollectionFragmentDoc: DocumentNode<NewCollectionFragment, unknown> = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NewCollection"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Collection"}},"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]};
export const FragmentInitAppFragmentDoc: DocumentNode<FragmentInitAppFragment, unknown> = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FragmentInitApp"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"hasUpdateAvailable"},"arguments":[],"directives":[]}]}}]};
export const FragmentAppHasUpdateAvailableFragmentDoc: DocumentNode<FragmentAppHasUpdateAvailableFragment, unknown> = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"FragmentAppHasUpdateAvailable"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"App"}},"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasUpdateAvailable"},"arguments":[],"directives":[]}]}}]};
export const QueryAuthDocument: DocumentNode<QueryAuthQuery, QueryAuthQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryAuth"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auth"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"isAuthenticated"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryUserIsLibraryProtectedDocument: DocumentNode<QueryUserIsLibraryProtectedQuery, QueryUserIsLibraryProtectedQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryUserIsLibraryProtected"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isLibraryUnlocked"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationAddCollectionsToBookDocument: DocumentNode<MutationAddCollectionsToBookMutation, MutationAddCollectionsToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationAddCollectionsToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collections"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCollectionsToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"collections"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collections"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationRemoveCollectionsToBookDocument: DocumentNode<MutationRemoveCollectionsToBookMutation, MutationRemoveCollectionsToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationRemoveCollectionsToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collections"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCollectionsToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"collections"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collections"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const AddBookDocument: DocumentNode<AddBookMutation, AddBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const Edit_BookDocument: DocumentNode<Edit_BookMutation, Edit_BookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EDIT_BOOK"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastMetadataUpdatedAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"readingStateCurrentBookmarkLocation"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"readingStateCurrentBookmarkProgressPercent"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"lastMetadataUpdatedAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastMetadataUpdatedAt"}}},{"kind":"Argument","name":{"kind":"Name","value":"readingStateCurrentBookmarkLocation"},"value":{"kind":"Variable","name":{"kind":"Name","value":"readingStateCurrentBookmarkLocation"}}},{"kind":"Argument","name":{"kind":"Name","value":"readingStateCurrentBookmarkProgressPercent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"readingStateCurrentBookmarkProgressPercent"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const RemoveBookDocument: DocumentNode<RemoveBookMutation, RemoveBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationAddTagsToBookDocument: DocumentNode<MutationAddTagsToBookMutation, MutationAddTagsToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationAddTagsToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addTagsToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"tags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationRemoveTagsToBookDocument: DocumentNode<MutationRemoveTagsToBookMutation, MutationRemoveTagsToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationRemoveTagsToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTagsToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"tags"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryBookIdsDocument: DocumentNode<QueryBookIdsQuery, QueryBookIdsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryBookIds"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryBooksDocument: DocumentNode<QueryBooksQuery, QueryBooksQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryBooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isProtected"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"isProtected"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isProtected"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BookDetailsWithAssociations"},"directives":[]}]}}]}},...BookDetailsWithAssociationsFragmentDoc.definitions]};
export const QueryBooksDownloadStateDocument: DocumentNode<QueryBooksDownloadStateQuery, QueryBooksDownloadStateQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryBooksDownloadState"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"downloadState"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryBookDocument: DocumentNode<QueryBookQuery, QueryBookQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"book"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BookDetailsWithAssociations"},"directives":[]}]}}]}},...BookDetailsWithAssociationsFragmentDoc.definitions]};
export const QueryBooksSyncStateDocument: DocumentNode<QueryBooksSyncStateQuery, QueryBooksSyncStateQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryBooksSyncState"},"variableDefinitions":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"noRetry"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncState"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"title"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"creator"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastMetadataUpdatedAt"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const QuerySyncTriggerBooksPropertiesDocument: DocumentNode<QuerySyncTriggerBooksPropertiesQuery, QuerySyncTriggerBooksPropertiesQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySyncTriggerBooksProperties"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastMetadataUpdatedAt"},"arguments":[],"directives":[]}]}}]}}]};
export const Add_CollectionDocument: DocumentNode<Add_CollectionMutation, Add_CollectionMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ADD_COLLECTION"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]};
export const Edit_CollectionDocument: DocumentNode<Edit_CollectionMutation, Edit_CollectionMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EDIT_COLLECTION"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]};
export const Remove_CollectionDocument: DocumentNode<Remove_CollectionMutation, Remove_CollectionMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"REMOVE_COLLECTION"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCollection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryCollectionIdsDocument: DocumentNode<QueryCollectionIdsQuery, QueryCollectionIdsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryCollectionIds"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collections"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const Get_CollectionsDocument: DocumentNode<Get_CollectionsQuery, Get_CollectionsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GET_COLLECTIONS"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"foo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collections"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"foo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"foo"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const QueryCollectionBookIdsDocument: DocumentNode<QueryCollectionBookIdsQuery, QueryCollectionBookIdsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryCollectionBookIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const Query_Collection_Document: DocumentNode<Query_Collection_Query, Query_Collection_QueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QUERY_COLLECTION_"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"collection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const MutationAddDataSourceDocument: DocumentNode<MutationAddDataSourceMutation, MutationAddDataSourceMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationAddDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataSourceType"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"asyncQueue"},"arguments":[]},{"kind":"Directive","name":{"kind":"Name","value":"blocking"},"arguments":[]},{"kind":"Directive","name":{"kind":"Name","value":"noRetry"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"type"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"data"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationSyncDataSourceDocument: DocumentNode<MutationSyncDataSourceMutation, MutationSyncDataSourceMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationSyncDataSource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"asyncQueue"},"arguments":[]},{"kind":"Directive","name":{"kind":"Name","value":"noRetry"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncDataSource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryDataSourcesIdsDocument: DocumentNode<QueryDataSourcesIdsQuery, QueryDataSourcesIdsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryDataSourcesIds"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryDataSourcesDocument: DocumentNode<QueryDataSourcesQuery, QueryDataSourcesQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryDataSources"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"type"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"data"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryDataSourceIdDocument: DocumentNode<QueryDataSourceIdQuery, QueryDataSourceIdQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryDataSourceId"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSource"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const QuerySyncableDataSourcePropertiesDocument: DocumentNode<QuerySyncableDataSourcePropertiesQuery, QuerySyncableDataSourcePropertiesQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySyncableDataSourceProperties"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryDataSourcesSyncStateDocument: DocumentNode<QueryDataSourcesSyncStateQuery, QueryDataSourcesSyncStateQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryDataSourcesSyncState"},"variableDefinitions":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"noRetry"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncState"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const QueryFirstTimeExperienceDocument: DocumentNode<QueryFirstTimeExperienceQuery, QueryFirstTimeExperienceQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryFirstTimeExperience"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstTimeExperience"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasDoneWelcomeTour"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]},{"kind":"Field","name":{"kind":"Name","value":"hasDoneReaderTour"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]}]}}]}}]};
export const SyncLibraryDocument: DocumentNode<SyncLibraryQuery, SyncLibraryQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SyncLibrary"},"variableDefinitions":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"noRetry"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BookDetails"},"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"tags"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"isProtected"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"links"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"resourceId"},"arguments":[],"directives":[]}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSources"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"type"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"lastSyncedAt"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"data"},"arguments":[],"directives":[]}]}}]}},...BookDetailsFragmentDoc.definitions]};
export const QueryInitSyncStateDocument: DocumentNode<QueryInitSyncStateQuery, QueryInitSyncStateQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryInitSyncState"},"variableDefinitions":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncState"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]}]}}]}}]};
export const QuerySyncHappeningDocument: DocumentNode<QuerySyncHappeningQuery, QuerySyncHappeningQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySyncHappening"},"variableDefinitions":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"syncState"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"happening"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationAddLinkDocument: DocumentNode<MutationAddLinkMutation, MutationAddLinkMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationAddLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bookId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LinkType"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"bookId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bookId"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationEditLinkDocument: DocumentNode<MutationEditLinkMutation, MutationEditLinkMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationEditLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LinkType"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationAppDocument: DocumentNode<MutationAppMutation, MutationAppMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationApp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasUpdateAvailable"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hasUpdateAvailable"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasUpdateAvailable"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"hasUpdateAvailable"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryAppHasUpdateAvailableDocument: DocumentNode<QueryAppHasUpdateAvailableQuery, QueryAppHasUpdateAvailableQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryAppHasUpdateAvailable"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"app"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasUpdateAvailable"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationRemoveTagDocument: DocumentNode<MutationRemoveTagMutation, MutationRemoveTagMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationRemoveTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    