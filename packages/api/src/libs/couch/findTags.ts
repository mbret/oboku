import type { SafeMangoQuery, TagsDocType } from "@oboku/shared"
import type createNano from "nano"
import type { MangoResponse } from "nano"
import { retryFn } from "./dbHelpers"

export const findTags = async (
  db: createNano.DocumentScope<unknown>,
  query: SafeMangoQuery<TagsDocType>,
) => {
  const { fields, ...restQuery } = query
  const response = await retryFn(
    () =>
      db.find({
        ...restQuery,
        fields: fields as string[],
        selector: { rx_model: "tag", ...(query?.selector as any) },
      }) as Promise<MangoResponse<TagsDocType>>,
  )

  return response.docs
}
