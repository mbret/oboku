import {
  AccountCircleRounded,
  LocalLibraryRounded,
  CloudSyncRounded,
  HomeRounded,
  ExtensionRounded,
} from "@mui/icons-material"
import { ROUTES } from "./routes"

export const navItems = [
  { icon: HomeRounded, label: "Home", route: ROUTES.HOME, matchPattern: "/" },
  {
    icon: LocalLibraryRounded,
    label: "Library",
    route: ROUTES.LIBRARY_ROOT,
    matchPattern: "/library/*",
  },
  {
    icon: CloudSyncRounded,
    label: "Sync",
    route: ROUTES.SYNC,
    matchPattern: "/sync/*",
  },
  {
    icon: ExtensionRounded,
    label: "Plugins",
    route: ROUTES.PLUGINS,
    matchPattern: "/plugins/*",
  },
  {
    icon: AccountCircleRounded,
    label: "Profile",
    route: ROUTES.PROFILE,
    matchPattern: "/profile/*",
  },
]
