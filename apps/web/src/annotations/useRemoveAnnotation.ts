import { useMutation } from "@tanstack/react-query"
import { firstValueFrom } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useRemoveAnnotation = () =>
  useMutation({
    mutationFn: async function removeAnnotation(id: string) {
      const database = await firstValueFrom(getLatestDatabase())

      return database.annotation.findOne(id).incrementalRemove()
    },
  })
