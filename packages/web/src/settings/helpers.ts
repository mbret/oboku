import { crypto } from "@oboku/shared"
import { SettingsDocType, useRxMutation } from "../rxdb"

export const useUpdateSettings = () =>
  useRxMutation(
    (db, variables: Partial<SettingsDocType>) =>
      db.settings.safeUpdate({ $set: variables }, collection => collection.findOne())
  )

export const useUpdateContentPassword = () => {
  const [updateSettings] = useUpdateSettings()

  return async (password: string) => {
    const hashed = await crypto.hashContentPassword(password)

    await updateSettings({ contentPassword: hashed })
  }
}