import {
  atomicUpdate,
  insert,
  findOne,
  find,
  getOrCreateTagFromName,
} from "../lib/couch/dbHelpers.js"
import type createNano from "nano"
import {
  type SafeMangoQuery,
  ObokuErrorCode,
  ObokuSharedError,
  type DataSourceType,
  type DocType,
  type LinkDataForProvider,
  type ModelOf,
  type SettingsConnectorType,
} from "@oboku/shared"
import type { SyncContext } from "./types.js"

export const createHelpers = (
  refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>,
  db: createNano.DocumentScope<unknown>,
) => {
  const helpers = {
    refreshBookMetadata: (opts: { bookId: string }) =>
      refreshBookMetadata(opts).catch(console.error),
    findOne: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>,
    ) => findOne(model, query, { db }),
    find: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      query: SafeMangoQuery<D>,
    ) => find(db, model, query),
    atomicUpdate: <M extends DocType["rx_model"], K extends ModelOf<M>>(
      model: M,
      id: string,
      cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>,
    ) => atomicUpdate(db, model, id, cb),
    create: <M extends DocType["rx_model"], D extends ModelOf<M>>(
      model: M,
      data: Omit<D, "rx_model" | "_id" | "_rev">,
    ) => insert(db, model, data),
    // addTagsFromNameToBook: (bookId: string, tagNames: string[]) => addTagsFromNameToBook(db, bookId, tagNames),
    getOrCreateTagFromName: (name: string) => getOrCreateTagFromName(db, name),
  }

  return helpers
}

export const createError = (
  code: "unknown" | "unauthorized" | "rateLimitExceeded" = "unknown",
  previousError?: Error,
) => {
  switch (code) {
    case "unauthorized":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNAUTHORIZED,
        previousError,
      )
    case "rateLimitExceeded":
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED,
        previousError,
      )
    default:
      return new ObokuSharedError(
        ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN,
        previousError,
      )
  }
}

type CandidateModel = "link" | "obokucollection"

/**
 * A sync item's identity in a link's shape: its provider `type` and the
 * `data` fields that identify its resource. Mango matches every field given,
 * so `data` holds the identity fields only.
 *
 * Distributive over `T`, so each provider's identity is checked against its
 * own selector.
 */
type LinkIdentity<T extends DataSourceType = DataSourceType> =
  T extends DataSourceType
    ? { type: T; data: Partial<LinkDataForProvider<T>> }
    : never

const candidateSelectors: {
  [Model in CandidateModel]: (
    identity: LinkIdentity,
  ) => SafeMangoQuery<ModelOf<Model>>["selector"]
} = {
  link: (identity) => identity,
  obokucollection: ({ type, data }) => ({ linkType: type, linkData: data }),
}

/**
 * Finds the links or collections whose stored identity is `identity`.
 *
 * `isUsingSameProviderCredentials` defaults to true: a data source that syncs
 * a resource has credentials for it.
 */
export const findCandidates = async <Model extends CandidateModel>(
  ctx: Pick<SyncContext, "db">,
  model: Model,
  identity: LinkIdentity,
  isUsingSameProviderCredentials = true,
) => {
  const candidates = await find(ctx.db, model, {
    selector: candidateSelectors[model](identity),
  })

  return candidates.map((candidate) => ({
    ...candidate,
    isUsingSameProviderCredentials,
  }))
}

/**
 * {@link findCandidates} for the providers whose links go through a
 * connector, which is part of their identity. Without a `connectorId` it
 * finds nothing, and the data source's credentials only reach the candidates
 * of its own connector.
 *
 * Matching is strict on purpose:
 * - A data source is a sync scope, not an owner: it syncs what it can see.
 * - The same resource can be reachable through several data sources or
 *   connectors, each with valid credentials.
 * - Connectors to the same normalized server URL are still different
 *   identities. "Same server" may serve other flows, but sync only reuses an
 *   exact match, which keeps it non-destructive.
 */
export const findConnectorCandidates = async <Model extends CandidateModel>(
  ctx: Pick<SyncContext<SettingsConnectorType>, "db" | "dataSource">,
  model: Model,
  identity: LinkIdentity<SettingsConnectorType>,
) => {
  const { connectorId } = identity.data

  if (!connectorId) return []

  const isUsingSameProviderCredentials =
    connectorId === ctx.dataSource.data_v2?.connectorId

  return findCandidates(ctx, model, identity, isUsingSameProviderCredentials)
}
