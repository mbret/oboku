import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAuthToken } from "@libs/auth"
import schema from "./schema"
import { findOne, getNanoDbForUser } from "@libs/couch/dbHelpers"
import { withDeleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { refreshMetadata } from "./src/refreshMetadata"
import { withMiddy } from "@libs/middy/withMiddy"
import { from, lastValueFrom, map, mergeMap, of, switchMap } from "rxjs"
import { parameters$ } from "./src/parameters"
import {
  onBeforeError,
  switchMapCombineOuter,
  switchMapMergeOuter
} from "@libs/utils"
import { withConfiguredGoogle } from "@libs/google/withConfiguredGoogle"
import { markCollectionAsError } from "./src/collections"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const collectionId = event.body.collectionId ?? ""
  const lockId = `metadata-collection_${collectionId}`

  const result = await lastValueFrom(
    of(event).pipe(
      map((event) => {
        const soft = event.body.soft === true
        const authorization = event.body.authorization ?? ``
        const rawCredentials = event.body.credentials ?? JSON.stringify({})
        const credentials = JSON.parse(rawCredentials)

        return {
          soft,
          authorization,
          credentials
        }
      }),
      switchMapMergeOuter(() => parameters$),
      withConfiguredGoogle,
      switchMapMergeOuter((params) =>
        getAuthToken(params.authorization, params.jwtPrivateKey)
      ),
      switchMapCombineOuter(({ name: userName, jwtPrivateKey }) =>
        from(getNanoDbForUser(userName, jwtPrivateKey))
      ),
      switchMap(([params, db]) =>
        from(
          findOne(db, "obokucollection", {
            selector: { _id: collectionId }
          })
        ).pipe(
          mergeMap((collection) => {
            if (!collection)
              throw new Error(`Unable to find book ${collectionId}`)

            return from(
              refreshMetadata(collection, {
                db,
                ...params
              })
            )
          }),
          onBeforeError(() => markCollectionAsError({ db, collectionId }))
        )
      ),
      map(() => {
        console.info(`lambda executed with success for ${collectionId}`)

        return {
          statusCode: 200,
          body: JSON.stringify({})
        }
      }),
      withDeleteLock(supabase, lockId)
    )
  )

  return result
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false
})
