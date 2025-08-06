import { replicateCouchDB } from "rxdb/plugins/replication-couchdb"
import type { RxCollection } from "rxdb"
import { configuration } from "../../config/configuration"
import { httpCouchClient } from "../../http/httpClientCouch.web"

export const replicateCouchDBCollection = ({
  dbName,
  collection,
  host,
  autoStart = false,
  cancelSignal,
  suffix,
  ...params
}: {
  dbName: string
  collection: RxCollection
  host?: string
  autoStart?: boolean
  cancelSignal: AbortSignal
  suffix?: string
} & Omit<
  Parameters<typeof replicateCouchDB>[0],
  "pull" | "push" | "url" | "replicationIdentifier" | "collection"
>) => {
  const uri = host ?? configuration.API_COUCH_URI

  return replicateCouchDB({
    replicationIdentifier: `${uri}/${dbName}-${collection.name}${suffix ? `-${suffix}` : ""}-replication`,
    collection: collection,
    url: `${uri}/${dbName}/`,
    live: false,
    waitForLeadership: false,
    autoStart,
    ...params,
    fetch: async (url, options) => {
      // flat clone the given options to not mutate the input
      const optionsWithAuth = Object.assign({}, options)
      // ensure the headers property exists
      if (!optionsWithAuth.headers) {
        optionsWithAuth.headers = {}
      }

      if (
        typeof url === "string" &&
        url.startsWith(`${uri}/${dbName}/_changes`)
      ) {
        const { response } = await httpCouchClient.fetch(
          `${url}&filter=_selector`,
          {
            ...optionsWithAuth,
            method: "post",
            headers: {
              ...optionsWithAuth.headers,
              "Content-Type": "application/json",
            },
            unwrap: false,
            signal: cancelSignal,
            validateStatus: () => true,
            body: JSON.stringify({ selector: { rx_model: collection.name } }),
          },
        )

        return response
      }

      // call the original fetch function with our custom options.
      const { response } = await httpCouchClient.fetch(url, {
        ...optionsWithAuth,
        signal: cancelSignal,
        unwrap: false,
        validateStatus: () => true,
      })

      return response
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
            delete docData.isHidden
          }
        }

        if ("rx_model" in docData && docData.rx_model === "link") {
          if ("data" in docData && typeof docData.data === "string") {
            try {
              docData.data = JSON.parse(docData.data)
            } catch (_error) {
              docData.data = {}
            }
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
