import { difference } from "ramda";
import { useCallback } from "react";
import { Report } from "../debug/report.shared";
import { useDatabase } from "../rxdb";
import { BookDocument } from "../rxdb/schemas/book";

export const useFixBookReferences = () => {
    const db = useDatabase()

    const removeDanglingCollectionsFromBook = useCallback(async (doc: BookDocument) => {
        if (doc.collections.length === 0) return

        const existingCollection = await db?.obokucollection.safeFind({
            selector: {
                _id: {
                    $in: doc.collections
                }
            }
        }).exec()

        const toRemove = difference(doc.collections, existingCollection?.map(doc => doc._id) ?? [])

        if (toRemove.length > 0) {
            await doc.atomicUpdate(data => ({
                ...data,
                collections: data.collections.filter(id => !toRemove.includes(id))
            }))
        }
    }, [db])

    return useCallback(
        async (data: BookDocument[]) => {
            const yes = window.confirm(
                `
            This action will remove non valid collection reference from all the books.
            `.replace(/  +/g, "")
            )

            if (yes && db) {
                try {
                    // we actually have middleware to deal with it so we will just force an update
                    Promise.all(data.map(removeDanglingCollectionsFromBook))
                } catch (e) {
                    Report.error(e)
                }
            }
        },
        [db, removeDanglingCollectionsFromBook]
    )


}