import createNano from "nano"
import { SafeMangoQuery, DocType, ModelOf } from "@oboku/shared"
import { retryFn } from "./dbHelpers"

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
  options: FindOneOptionsWithThrow
): Promise<
  D & {
    _id: string
    _rev: string
  }
>

export function findOne<M extends DocType["rx_model"], D extends ModelOf<M>>(
  rxModel: M,
  query: SafeMangoQuery<D>,
  options: FindOneOptionsWithoutThrow
): Promise<
  | (D & {
      _id: string
      _rev: string
    })
  | null
>

export async function findOne<
  M extends DocType["rx_model"],
  D extends ModelOf<M>
>(rxModel: M, query: SafeMangoQuery<D>, options: FindOneOptions) {
  const { fields, ...restQuery } = query
  const fieldsWithRequiredFields = fields
  if (Array.isArray(fieldsWithRequiredFields)) {
    fieldsWithRequiredFields.push(`rx_model`)
  }

  const response = await retryFn(() =>
    options.db.find({
      ...restQuery,
      fields: fields as string[],
      selector: { rx_model: rxModel, ...(query?.selector as any) },
      limit: 1
    })
  )

  if (response.docs.length === 0) {
    if (options.throwOnNotFound) {
      throw new Error("Document not found")
    }
    return null
  }

  const doc = response
    .docs[0] as createNano.MangoResponse<unknown>["docs"][number] & D

  if (rxModel !== doc.rx_model) throw new Error(`Invalid document type`)

  return doc
}
