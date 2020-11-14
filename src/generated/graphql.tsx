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
  id: Scalars['ID'];
  email?: Maybe<Scalars['String']>;
  contentPassword?: Maybe<Scalars['String']>;
};

export type Book = {
  __typename?: 'Book';
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
  series?: Maybe<Array<Maybe<Series>>>;
  subject?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Tag>>>;
  title?: Maybe<Scalars['String']>;
};

export type Books = {
  __typename?: 'Books';
  id: Scalars['ID'];
  timestamp?: Maybe<Scalars['Float']>;
  books?: Maybe<Array<Maybe<Book>>>;
};

export type Link = {
  __typename?: 'Link';
  id: Scalars['ID'];
  location?: Maybe<Scalars['String']>;
};

export type Tag = {
  __typename?: 'Tag';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  books?: Maybe<Array<Maybe<Book>>>;
  isProtected?: Maybe<Scalars['Boolean']>;
};

export type Series = {
  __typename?: 'Series';
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  books?: Maybe<Array<Maybe<Book>>>;
};

export type Query = {
  __typename?: 'Query';
  book?: Maybe<Book>;
  books?: Maybe<Books>;
  booksMetadata?: Maybe<Array<Maybe<Book>>>;
  firstTimeExperience?: Maybe<FirstTimeExperience>;
  links?: Maybe<Array<Maybe<Link>>>;
  oneSeries?: Maybe<Series>;
  series?: Maybe<Array<Maybe<Series>>>;
  tag?: Maybe<Tag>;
  tags?: Maybe<Array<Maybe<Tag>>>;
};


export type QueryBookArgs = {
  id: Scalars['ID'];
};


export type QueryOneSeriesArgs = {
  id: Scalars['ID'];
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
  signup?: Maybe<AuthenticationResponse>;
  signin?: Maybe<AuthenticationResponse>;
  editUser?: Maybe<User>;
  addBook?: Maybe<MutationResponse>;
  removeBook?: Maybe<Book>;
  editBook?: Maybe<Book>;
  addTagsToBook?: Maybe<MutationResponse>;
  removeTagsToBook?: Maybe<MutationResponse>;
  addSeriesToBook?: Maybe<MutationResponse>;
  removeSeriesToBook?: Maybe<MutationResponse>;
  addTag?: Maybe<Tag>;
  removeTag?: Maybe<MutationResponse>;
  editTag?: Maybe<Tag>;
  addSeries?: Maybe<Series>;
  removeSeries?: Maybe<MutationResponse>;
  editSeries?: Maybe<Series>;
  addLink?: Maybe<MutationResponse>;
  editLink?: Maybe<MutationResponse>;
};


export type MutationSignupArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationSigninArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationEditUserArgs = {
  id: Scalars['ID'];
  contentPassword?: Maybe<Scalars['String']>;
};


export type MutationAddBookArgs = {
  id: Scalars['ID'];
  location: Scalars['String'];
};


export type MutationRemoveBookArgs = {
  id: Scalars['ID'];
};


export type MutationEditBookArgs = {
  id: Scalars['ID'];
  lastMetadataUpdatedAt?: Maybe<Scalars['Float']>;
  title?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkLocation?: Maybe<Scalars['String']>;
  readingStateCurrentBookmarkProgressPercent?: Maybe<Scalars['Float']>;
};


export type MutationAddTagsToBookArgs = {
  id: Scalars['ID'];
  tags?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationRemoveTagsToBookArgs = {
  id: Scalars['ID'];
  tags?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationAddSeriesToBookArgs = {
  id: Scalars['ID'];
  series?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationRemoveSeriesToBookArgs = {
  id: Scalars['ID'];
  series?: Maybe<Array<Maybe<Scalars['ID']>>>;
};


export type MutationAddTagArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};


export type MutationRemoveTagArgs = {
  id: Scalars['ID'];
};


export type MutationEditTagArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  isProtected?: Maybe<Scalars['Boolean']>;
};


export type MutationAddSeriesArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};


export type MutationRemoveSeriesArgs = {
  id: Scalars['ID'];
};


export type MutationEditSeriesArgs = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};


export type MutationAddLinkArgs = {
  id: Scalars['ID'];
  bookId: Scalars['ID'];
  location: Scalars['String'];
};


export type MutationEditLinkArgs = {
  id: Scalars['ID'];
  location: Scalars['String'];
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

export type MutationAddSeriesToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  series: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationAddSeriesToBookMutation = (
  { __typename?: 'Mutation' }
  & { addSeriesToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type MutationRemoveSeriesToBookMutationVariables = Exact<{
  id: Scalars['ID'];
  series: Array<Maybe<Scalars['ID']>>;
}>;


export type MutationRemoveSeriesToBookMutation = (
  { __typename?: 'Mutation' }
  & { removeSeriesToBook?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
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

export type Add_SeriesMutationVariables = Exact<{
  id: Scalars['ID'];
  name: Scalars['String'];
}>;


export type Add_SeriesMutation = (
  { __typename?: 'Mutation' }
  & { addSeries?: Maybe<(
    { __typename?: 'Series' }
    & Pick<Series, 'id' | 'name'>
  )> }
);

export type Edit_SeriesMutationVariables = Exact<{
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
}>;


export type Edit_SeriesMutation = (
  { __typename?: 'Mutation' }
  & { editSeries?: Maybe<(
    { __typename?: 'Series' }
    & Pick<Series, 'id' | 'name'>
  )> }
);

export type Remove_SeriesMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type Remove_SeriesMutation = (
  { __typename?: 'Mutation' }
  & { removeSeries?: Maybe<(
    { __typename?: 'MutationResponse' }
    & Pick<MutationResponse, 'success'>
  )> }
);

export type QuerySeriesIdsQueryVariables = Exact<{ [key: string]: never; }>;


export type QuerySeriesIdsQuery = (
  { __typename?: 'Query' }
  & { series?: Maybe<Array<Maybe<(
    { __typename: 'Series' }
    & Pick<Series, 'id'>
  )>>> }
);

export type QueryOneSeriesBooksQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type QueryOneSeriesBooksQuery = (
  { __typename?: 'Query' }
  & { oneSeries?: Maybe<(
    { __typename?: 'Series' }
    & Pick<Series, 'id'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )> }
);

export type Query_One_Series_QueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type Query_One_Series_Query = (
  { __typename?: 'Query' }
  & { oneSeries?: Maybe<(
    { __typename?: 'Series' }
    & Pick<Series, 'id' | 'name'>
    & { books?: Maybe<Array<Maybe<(
      { __typename?: 'Book' }
      & Pick<Book, 'id'>
    )>>> }
  )> }
);

export type UserKeySpecifier = ('id' | 'email' | 'contentPassword' | UserKeySpecifier)[];
export type UserFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	email?: FieldPolicy<any> | FieldReadFunction<any>,
	contentPassword?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BookKeySpecifier = ('createdAt' | 'creator' | 'date' | 'downloadProgress' | 'downloadState' | 'id' | 'language' | 'lastMetadataUpdatedAt' | 'links' | 'publisher' | 'readingStateCurrentBookmarkLocation' | 'readingStateCurrentBookmarkProgressPercent' | 'readingStateCurrentBookmarkProgressUpdatedAt' | 'rights' | 'series' | 'subject' | 'tags' | 'title' | BookKeySpecifier)[];
export type BookFieldPolicy = {
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
	series?: FieldPolicy<any> | FieldReadFunction<any>,
	subject?: FieldPolicy<any> | FieldReadFunction<any>,
	tags?: FieldPolicy<any> | FieldReadFunction<any>,
	title?: FieldPolicy<any> | FieldReadFunction<any>
};
export type BooksKeySpecifier = ('id' | 'timestamp' | 'books' | BooksKeySpecifier)[];
export type BooksFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	timestamp?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>
};
export type LinkKeySpecifier = ('id' | 'location' | LinkKeySpecifier)[];
export type LinkFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	location?: FieldPolicy<any> | FieldReadFunction<any>
};
export type TagKeySpecifier = ('id' | 'name' | 'books' | 'isProtected' | TagKeySpecifier)[];
export type TagFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>,
	isProtected?: FieldPolicy<any> | FieldReadFunction<any>
};
export type SeriesKeySpecifier = ('id' | 'name' | 'books' | SeriesKeySpecifier)[];
export type SeriesFieldPolicy = {
	id?: FieldPolicy<any> | FieldReadFunction<any>,
	name?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>
};
export type QueryKeySpecifier = ('book' | 'books' | 'booksMetadata' | 'firstTimeExperience' | 'links' | 'oneSeries' | 'series' | 'tag' | 'tags' | QueryKeySpecifier)[];
export type QueryFieldPolicy = {
	book?: FieldPolicy<any> | FieldReadFunction<any>,
	books?: FieldPolicy<any> | FieldReadFunction<any>,
	booksMetadata?: FieldPolicy<any> | FieldReadFunction<any>,
	firstTimeExperience?: FieldPolicy<any> | FieldReadFunction<any>,
	links?: FieldPolicy<any> | FieldReadFunction<any>,
	oneSeries?: FieldPolicy<any> | FieldReadFunction<any>,
	series?: FieldPolicy<any> | FieldReadFunction<any>,
	tag?: FieldPolicy<any> | FieldReadFunction<any>,
	tags?: FieldPolicy<any> | FieldReadFunction<any>
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
export type MutationKeySpecifier = ('signup' | 'signin' | 'editUser' | 'addBook' | 'removeBook' | 'editBook' | 'addTagsToBook' | 'removeTagsToBook' | 'addSeriesToBook' | 'removeSeriesToBook' | 'addTag' | 'removeTag' | 'editTag' | 'addSeries' | 'removeSeries' | 'editSeries' | 'addLink' | 'editLink' | MutationKeySpecifier)[];
export type MutationFieldPolicy = {
	signup?: FieldPolicy<any> | FieldReadFunction<any>,
	signin?: FieldPolicy<any> | FieldReadFunction<any>,
	editUser?: FieldPolicy<any> | FieldReadFunction<any>,
	addBook?: FieldPolicy<any> | FieldReadFunction<any>,
	removeBook?: FieldPolicy<any> | FieldReadFunction<any>,
	editBook?: FieldPolicy<any> | FieldReadFunction<any>,
	addTagsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	removeTagsToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	addSeriesToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	removeSeriesToBook?: FieldPolicy<any> | FieldReadFunction<any>,
	addTag?: FieldPolicy<any> | FieldReadFunction<any>,
	removeTag?: FieldPolicy<any> | FieldReadFunction<any>,
	editTag?: FieldPolicy<any> | FieldReadFunction<any>,
	addSeries?: FieldPolicy<any> | FieldReadFunction<any>,
	removeSeries?: FieldPolicy<any> | FieldReadFunction<any>,
	editSeries?: FieldPolicy<any> | FieldReadFunction<any>,
	addLink?: FieldPolicy<any> | FieldReadFunction<any>,
	editLink?: FieldPolicy<any> | FieldReadFunction<any>
};
export type FirstTimeExperienceKeySpecifier = ('hasDoneWelcomeTour' | 'hasDoneReaderTour' | FirstTimeExperienceKeySpecifier)[];
export type FirstTimeExperienceFieldPolicy = {
	hasDoneWelcomeTour?: FieldPolicy<any> | FieldReadFunction<any>,
	hasDoneReaderTour?: FieldPolicy<any> | FieldReadFunction<any>
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
	Books?: {
		keyFields?: false | BooksKeySpecifier | (() => undefined | BooksKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: BooksFieldPolicy,
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
	Series?: {
		keyFields?: false | SeriesKeySpecifier | (() => undefined | SeriesKeySpecifier),
		queryType?: true,
		mutationType?: true,
		subscriptionType?: true,
		fields?: SeriesFieldPolicy,
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
	}
};

export const MutationAddSeriesToBookDocument: DocumentNode<MutationAddSeriesToBookMutation, MutationAddSeriesToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationAddSeriesToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"series"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSeriesToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"series"},"value":{"kind":"Variable","name":{"kind":"Name","value":"series"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const MutationRemoveSeriesToBookDocument: DocumentNode<MutationRemoveSeriesToBookMutation, MutationRemoveSeriesToBookMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MutationRemoveSeriesToBook"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"series"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSeriesToBook"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"series"},"value":{"kind":"Variable","name":{"kind":"Name","value":"series"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryFirstTimeExperienceDocument: DocumentNode<QueryFirstTimeExperienceQuery, QueryFirstTimeExperienceQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryFirstTimeExperience"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstTimeExperience"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasDoneWelcomeTour"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]},{"kind":"Field","name":{"kind":"Name","value":"hasDoneReaderTour"},"arguments":[],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"client"},"arguments":[]}]}]}}]}}]};
export const Add_SeriesDocument: DocumentNode<Add_SeriesMutation, Add_SeriesMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ADD_SERIES"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]};
export const Edit_SeriesDocument: DocumentNode<Edit_SeriesMutation, Edit_SeriesMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EDIT_SERIES"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]};
export const Remove_SeriesDocument: DocumentNode<Remove_SeriesMutation, Remove_SeriesMutationVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"REMOVE_SERIES"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"},"arguments":[],"directives":[]}]}}]}}]};
export const QuerySeriesIdsDocument: DocumentNode<QuerySeriesIdsQuery, QuerySeriesIdsQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QuerySeriesIds"},"variableDefinitions":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"series"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]};
export const QueryOneSeriesBooksDocument: DocumentNode<QueryOneSeriesBooksQuery, QueryOneSeriesBooksQueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueryOneSeriesBooks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oneSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]}}]};
export const Query_One_Series_Document: DocumentNode<Query_One_Series_Query, Query_One_Series_QueryVariables> = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QUERY_ONE_SERIES_"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"oneSeries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]},{"kind":"Field","name":{"kind":"Name","value":"books"},"arguments":[],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"},"arguments":[],"directives":[]}]}}]}}]}}]};

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    