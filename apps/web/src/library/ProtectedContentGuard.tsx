import { memo } from "react"
import { Button, Stack, Typography, styled } from "@mui/material"
import { LockRounded } from "@mui/icons-material"
import { unlockLibrary } from "./libraryLock"

const RootStack = styled(Stack)(({ theme }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  textAlign: "center",
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
}))

const HeroLockRoundedIcon = styled(LockRounded)({
  fontSize: 56,
})

/**
 * Inline notice for screens whose data depends on protected content
 * being visible while the library is locked. Renders a centered card
 * with a lock icon, a title, a description, and an inline "Unlock
 * library" affordance.
 *
 * Owns no page chrome (no `Page`, no `TopBarNavigation`) — the host
 * screen is responsible for layout. Pair with a host-level
 * `tag?.isProtected && !isLibraryUnlocked` (or equivalent) check to
 * decide when to render this instead of the actual content.
 */
export const ProtectedContentGuard = memo(function ProtectedContentGuard({
  title = "This content is protected",
  description = "Unlock protected contents to view and manage it.",
}: {
  title?: string
  description?: string
}) {
  return (
    <RootStack>
      <HeroLockRoundedIcon color="primary" />
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={unlockLibrary}
        startIcon={<LockRounded />}
      >
        Unlock library
      </Button>
    </RootStack>
  )
})
