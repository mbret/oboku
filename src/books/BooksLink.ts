import { ApolloLink, NextLink, Operation } from "apollo-link"
import { createPolling, forOperationAs } from "../utils"
import { Book, Maybe, MutationAddCollectionsToBookDocument, MutationRemoveCollectionsToBookDocument, QueryBookIdsDocument, QueryBooksSyncStateDocument, QuerySyncTriggerBooksPropertiesDocument, Collection, SyncLibraryDocument } from "../generated/graphql"
import { OfflineApolloClient } from "../client"
import { Reference } from "@apollo/client"

class BooksLink extends ApolloLink {
  protected client: OfflineApolloClient<any> | undefined

  public request = (operation: Operation, forward: NextLink) => {
    const context = operation.getContext()
    const client = context.client as OfflineApolloClient<any>

    forOperationAs(operation, MutationAddCollectionsToBookDocument, ({ variables }) => {
      const bookRefId = client.identify({ __typename: 'Book', id: variables?.id })
      if (variables && bookRefId) {
        client.modify('Book', {
          id: bookRefId,
          fields: {
            collections: (existing, { toReference }) => {
                let newCollections = [...existing]
                variables.collections.forEach(id => {
                  const ref = toReference({ __typename: 'Collection', id: id })
                  if (ref) {
                    newCollections.push(ref)
                  }
                })
                return newCollections
            }
          }
        })
        variables.collections.forEach(collectionId => {
          const collectionRefId = client.identify({ __typename: 'Collection', id: collectionId })
          collectionRefId && bookRefId && client.modify('Collection', {
            id: collectionRefId,
            fields: {
              books: (existing, { toReference }) => {
                const ref = toReference(bookRefId)
                if (ref) return [...existing, ref]
                return existing
              }
            }
          })
        })
      }
    })

    forOperationAs(operation, MutationRemoveCollectionsToBookDocument, ({ variables }) => {
      const bookRefId = client.identify({ __typename: 'Book', id: variables?.id })
      const collectionReferences = variables?.collections.map(id => client.identify({ __typename: 'Collection', id })) || []

      if (bookRefId) {
        client.modify('Book', {
          id: bookRefId,
          fields: {
            collections: (existing: Reference[]) => existing.filter(item => !collectionReferences.includes(item.__ref))
          }
        })
        collectionReferences.forEach(collectionRefId => {
          collectionRefId && client.modify('Collection', {
            id: collectionRefId,
            fields: {
              books: (existing: Reference[]) => existing.filter(item => item.__ref !== bookRefId)
            }
          })
        })
      }
    })

    return forward(operation)
  }

  init = async (client: OfflineApolloClient<any>) => {
    this.client = client
    this.migrateLocalState()
    this.watchForSyncState()
    // this.watchForDataSourceSyncUpdate()
  }

  protected migrateLocalState = () => {
    let data
    try {
      data = this.client?.readQuery({ query: QueryBookIdsDocument })
    } catch (_) { }
    if (!data) {
      this.client?.writeQuery({ query: QueryBookIdsDocument, data: { books: [] } })
    }
  }

  // protected watchForDataSourceSyncUpdate = () => {
  //   this.client?.watchQuery({ query: QueryDataSourcesSyncUpdateDocument })
  //     .subscribe(async () => {
  //       const { auth } = this.client?.readQuery({ query: QueryAuthDocument }) || {}
  //       if (!auth?.isAuthenticated) return
  //       try {
  //         await this.client?.query({ query: SyncLibraryDocument, fetchPolicy: 'network-only' })
  //       } catch (e) {
  //         console.error(e)
  //       }
  //     })
  // }

  protected watchForSyncState = async () => {
    const shouldContinuePolling = (items: Maybe<Book>[]) => items.some(item => item?.lastMetadataUpdatedAt === null)
    const [start, stop] = createPolling(async () => {
      try {
        const data = await this.client?.query({ query: QueryBooksSyncStateDocument, fetchPolicy: 'network-only' })
        if (!shouldContinuePolling(data?.data.syncState?.books || [])) {
          stop()
        }
      } catch (e) {
        console.error(e)
      }
    }, 5000)

    /**
     * Watch properties on books that might require some automatic sync pulling
     */
    this.client?.watchQuery({ query: QuerySyncTriggerBooksPropertiesDocument })
      .subscribe(async (data) => {
        if (shouldContinuePolling(data.data.books || [])) {
          start()
        } else {
          stop()
        }
      })
  }
}

export const booksLink = new BooksLink()