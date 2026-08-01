import { GppGoodRounded, GppMaybeRounded } from "@mui/icons-material"
import {
  Link,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { links } from "@oboku/shared"
import { useIsStoragePersisted } from "../../../storage/useIsStoragePersisted"
import { useRequestStoragePersistence } from "../../../storage/useRequestStoragePersistence"

const PROTECTED_DESCRIPTION =
  "Protected from automatic deletion by the browser."
const UNPROTECTED_DESCRIPTION =
  "The browser may delete your library and uploaded books to reclaim space. Tap to protect."
const REFUSED_DESCRIPTION =
  "Refused by the browser. Installing oboku as an app usually helps."

const withReadMore = (description: string) => (
  <>
    {`${description} `}
    <Link
      href={links.documentationStorage}
      target="_blank"
      rel="noopener"
      onClick={function keepRowActionFromFiring(event) {
        event.stopPropagation()
      }}
    >
      Read more
    </Link>
  </>
)

export const StoragePersistenceListItem = () => {
  const { data: isPersisted } = useIsStoragePersisted()
  const {
    mutate: requestStoragePersistence,
    isPending: isRequestingPersistence,
    data: wasRequestGranted,
  } = useRequestStoragePersistence()

  if (isPersisted === undefined) return null

  if (isPersisted) {
    return (
      <ListItem>
        <ListItemIcon>
          <GppGoodRounded color="success" />
        </ListItemIcon>
        <ListItemText
          primary="Storage is protected"
          secondary={withReadMore(PROTECTED_DESCRIPTION)}
        />
      </ListItem>
    )
  }

  return (
    <ListItemButton
      disabled={isRequestingPersistence}
      onClick={function requestPersistence() {
        requestStoragePersistence()
      }}
    >
      <ListItemIcon>
        <GppMaybeRounded color="error" />
      </ListItemIcon>
      <ListItemText
        primary="Protect storage from deletion"
        secondary={withReadMore(
          wasRequestGranted === false
            ? REFUSED_DESCRIPTION
            : UNPROTECTED_DESCRIPTION,
        )}
      />
    </ListItemButton>
  )
}
