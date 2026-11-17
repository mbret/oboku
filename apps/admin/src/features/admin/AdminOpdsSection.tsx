import { InstanceSettingsSection } from "./InstanceSettingsSection"
import { NumberSettingForm } from "./NumberSettingForm"

export function AdminOpdsSection() {
  return (
    <InstanceSettingsSection
      title="OPDS servers"
      description="Maximum number of OPDS servers each user can have. Lowering it deletes none of their servers."
      renderSettings={function renderOpdsSettings(settings) {
        return (
          <NumberSettingForm
            label="Maximum OPDS servers per user"
            saveLabel="save OPDS settings"
            rangeError="Must be at least 1"
            savedValue={settings.opdsServersMaxPerUser}
            toSettings={function toOpdsSettings(opdsServersMaxPerUser) {
              return { opdsServersMaxPerUser }
            }}
          />
        )
      }}
    />
  )
}
