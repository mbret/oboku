import { ApolloLink, FetchResult, NextLink, Operation } from "apollo-link"
import { OfflineApolloClient } from "../client"
import { DataSource, Maybe, MutationAddDataSourceDocument, MutationSyncDataSourceDocument, QueryDataSourcesIdsDocument, QueryDataSourcesSyncStateDocument, QuerySyncableDataSourcePropertiesDocument, SyncLibraryDocument } from "../generated/graphql"
import { createPolling, forOperationAs } from "../utils"

class DataSourcesLink extends ApolloLink {
  protected client: OfflineApolloClient<any> | undefined

  public request = (operation: Operation, forward: NextLink) => {
    const context = operation.getContext()
    const client = context.client as OfflineApolloClient<any>

    forOperationAs(operation, MutationSyncDataSourceDocument, ({ variables }) => {
      const cacheId = client.identify({ __typename: 'DataSource', id: variables?.id })
      cacheId && client.modify('DataSource', {
        id: cacheId,
        fields: {
          lastSyncedAt: () => null,
        }
      })
    })

    return forward(operation).map(data => {

      forOperationAs(operation, MutationAddDataSourceDocument, () => {
        const mutationData = data as FetchResult<typeof MutationAddDataSourceDocument.__resultType>
        const entity = mutationData?.data?.addDataSource
        if (entity) {
          client.modify('Query', {
            fields: {
              dataSources: (existing = [], { toReference }) => {
                const ref = toReference(entity)
                if (ref) return [...existing, ref]
                return existing
              }
            },
          })
        }
      })

      return data
    })
  }

  init = async (client: OfflineApolloClient<any>) => {
    this.client = client
    this.migrateLocalState()
    this.watchForSyncState()
  }

  protected migrateLocalState = () => {
    let data
    try {
      data = this.client?.readQuery({ query: QueryDataSourcesIdsDocument })
    } catch (_) { }
    if (!data) {
      this.client?.writeQuery({ query: QueryDataSourcesIdsDocument, data: { dataSources: [] } })
    }
  }

  protected watchForSyncState = async () => {
    const shouldContinuePolling = (items: Maybe<DataSource>[]) => items.some(item => item?.lastSyncedAt === null)
    const [start, stop] = createPolling(async () => {
      try {
        const data = await this.client?.query({ query: QueryDataSourcesSyncStateDocument, fetchPolicy: 'network-only' })
        if (!shouldContinuePolling(data?.data.syncState?.dataSources || [])) {
          stop()

          // sync library since we most likely have new changes
          this.client?.query({ query: SyncLibraryDocument, fetchPolicy: 'network-only' }).catch(console.error)
        }
      } catch (e) {
        console.error(e)
      }
    }, 5000)

    this.client?.watchQuery({ query: QuerySyncableDataSourcePropertiesDocument })
      .subscribe(async (data) => {
        if (shouldContinuePolling(data.data.dataSources || [])) {
          start()
        } else {
          stop()
        }
      })
  }
}

export const dataSourcesLink = new DataSourcesLink()