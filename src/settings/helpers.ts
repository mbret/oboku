import { hashContentPassword } from "oboku-shared/dist/crypto"
import { SettingsDocType, useRxMutation } from "../rxdb"

export const useUpdateSettings = () =>
  useRxMutation<Partial<SettingsDocType>>(
    (db, { variables }) =>
      db.settings.safeUpdate({ $set: variables }, collection => collection.findOne())
  )

export const useUpdateContentPassword = () => {
  const [updateSettings] = useUpdateSettings()

  return async (password: string) => {
    const hashed = await hashContentPassword(password)

    await updateSettings({ contentPassword: hashed })
  }
}