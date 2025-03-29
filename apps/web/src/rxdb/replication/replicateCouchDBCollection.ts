import { replicateCouchDB } from "rxdb/plugins/replication-couchdb"
import type { RxCollection } from "rxdb"
import { configuration } from "../../config/configuration"

export const replicateCouchDBCollection = ({
  dbName,
  token,
  collection,
  host,
  ...params
}: {
  dbName: string
  token: string
  collection: RxCollection
  host?: string
} & Omit<
  Parameters<typeof replicateCouchDB>[0],
  "pull" | "push" | "url" | "replicationIdentifier" | "collection"
>) => {
  const uri = host ?? configuration.API_COUCH_URI

  return replicateCouchDB({
    replicationIdentifier: `${uri}/${dbName}-${collection.name}-replication`,
    collection: collection,
    url: `${uri}/${dbName}/`,
    live: false,
    waitForLeadership: false,
    ...params,
    fetch: (url, options) => {
      // flat clone the given options to not mutate the input
      const optionsWithAuth = Object.assign({}, options)
      // ensure the headers property exists
      if (!optionsWithAuth.headers) {
        optionsWithAuth.headers = {}
      }

      // add bearer token to headers
      // @ts-expect-error
      optionsWithAuth.headers.Authorization = `Bearer ${token}`

      if (
        typeof url === "string" &&
        url.startsWith(`${uri}/${dbName}/_changes`)
      ) {
        return fetch(`${url}&filter=_selector`, {
          ...optionsWithAuth,
          method: "post",
          headers: {
            ...optionsWithAuth.headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selector: { rx_model: collection.name } }),
        })
      }

      // call the original fetch function with our custom options.
      return fetch(url, optionsWithAuth)
    },
    pull: {
      /**
       * Amount of documents to be fetched in one HTTP request
       * (optional)
       */
      batchSize: 60,
      /**
       * Custom modifier to mutate pulled documents
       * before storing them in RxDB.
       * (optional)
       */
      modifier: (docData) => {
        // @todo move somewhere else
        if ("rx_model" in docData && docData.rx_model === "tag") {
          // old property not used anymore
          if ("isHidden" in docData) {
            // biome-ignore lint/performance/noDelete: <explanation>
            delete docData.isHidden
          }
        }

        return docData
      },
    },
    push: {
      /**
       * How many local changes to process at once.
       * (optional)
       */
      batchSize: 60,
      /**
       * Custom modifier to mutate documents
       * before sending them to the CouchDB endpoint.
       * (optional)
       */
      modifier: (docData) => {
        return docData
      },
    },
  })
}
