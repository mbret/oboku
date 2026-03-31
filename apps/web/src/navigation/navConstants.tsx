import {
  AccountCircleRounded,
  LocalLibraryRounded,
  CloudSyncRounded,
  HomeRounded,
  ExtensionRounded,
} from "@mui/icons-material"
import { ROUTES } from "./routes"

export const navItems = [
  { icon: HomeRounded, label: "Home", route: ROUTES.HOME },
  { icon: LocalLibraryRounded, label: "Library", route: ROUTES.LIBRARY_BOOKS },
  { icon: CloudSyncRounded, label: "Sync", route: ROUTES.SYNC },
  { icon: ExtensionRounded, label: "Plugins", route: ROUTES.PLUGINS },
  { icon: AccountCircleRounded, label: "Profile", route: ROUTES.PROFILE },
]
