import { NumberSettingSection } from "./NumberSettingSection"

export function AdminOpdsSection() {
  return (
    <NumberSettingSection
      title="OPDS servers"
      description="Maximum number of OPDS servers each user can have. Lowering it deletes none of their servers."
      label="Maximum OPDS servers per user"
      saveLabel="save OPDS settings"
      minimumError="Must be at least 1"
      toSavedValue={function toOpdsServersMaxPerUser(settings) {
        return settings.opdsServersMaxPerUser
      }}
      toSettings={function toOpdsSettings(opdsServersMaxPerUser) {
        return { opdsServersMaxPerUser }
      }}
    />
  )
}
