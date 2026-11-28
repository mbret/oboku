import { useMutation } from "@tanstack/react-query"
import { ensureDatabase, useDatabase } from "../../rxdb"

/** Saves the user's Send to Kindle address in their settings, or removes it with `null`. */
export const useSetKindleEmail = () => {
  const { db } = useDatabase()

  return useMutation({
    mutationFn: async function saveKindleEmail(kindleEmail: string | null) {
      const settings = await ensureDatabase(db)
        .settings.findOne("settings")
        .exec()

      return settings?.incrementalPatch({ kindleEmail })
    },
  })
}
