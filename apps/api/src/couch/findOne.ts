import type createNano from "nano"
import type { SafeMangoQuery, DocType, ModelOf } from "@oboku/shared"
import { find } from "./dbHelpers"

type FindOneOptionsBase = {
  db: createNano.DocumentScope<unknown>
}

type FindOneOptionsWithThrow = FindOneOptionsBase & {
  throwOnNotFound: true
}

type FindOneOptionsWithoutThrow = FindOneOptionsBase & {
  throwOnNotFound?: false
}

type FindOneOptions = FindOneOptionsWithThrow | FindOneOptionsWithoutThrow

export function findOne<M extends DocType["rx_model"], D extends ModelOf<M>>(
  rxModel: M,
  query: SafeMangoQuery<D>,
  options: FindOneOptionsWithThrow,
): Promise<
  D & {
    _id: string
    _rev: string
  }
>

export function findOne<M extends DocType["rx_model"], D extends ModelOf<M>>(
  rxModel: M,
  query: SafeMangoQuery<D>,
  options: FindOneOptionsWithoutThrow,
): Promise<
  | (D & {
      _id: string
      _rev: string
    })
  | null
>

export async function findOne<
  M extends DocType["rx_model"],
  D extends ModelOf<M>,
>(rxModel: M, query: SafeMangoQuery<D>, options: FindOneOptions) {
  const [doc] = await find(options.db, rxModel, { ...query, limit: 1 })

  if (!doc) {
    if (options.throwOnNotFound) {
      throw new Error("Document not found")
    }
    return null
  }

  return doc
}
