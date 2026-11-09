import { ListItem, ListItemText, Switch } from "@mui/material"
import { isCatalogEnabled } from "@oboku/shared"
import {
  CATALOG_PROVIDER_IDS,
  getCatalogProviderNameById,
} from "../../books/metadata/sources"
import { PageSection } from "../../common/PageSection"
import { useSettings } from "../../settings/useSettings"
import { useSetCatalogEnabled } from "./useSetCatalogEnabled"

/** The catalogs a metadata refresh asks for book details, each one on or off. */
export function CatalogsSection() {
  const { data: settings } = useSettings()
  const { mutate: setCatalogEnabled } = useSetCatalogEnabled()

  return (
    <PageSection title="Catalogs">
      {CATALOG_PROVIDER_IDS.map((id) => {
        const name = getCatalogProviderNameById(id)

        return (
          <ListItem
            key={id}
            secondaryAction={
              <Switch
                edge="end"
                slotProps={{ input: { "aria-label": name } }}
                checked={isCatalogEnabled(settings?.catalogs, id)}
                onChange={function toggleCatalog(_event, isEnabled) {
                  setCatalogEnabled({ id, isEnabled })
                }}
              />
            }
          >
            <ListItemText
              primary={name}
              secondary="Asked for book details when metadata is refreshed"
            />
          </ListItem>
        )
      })}
    </PageSection>
  )
}
