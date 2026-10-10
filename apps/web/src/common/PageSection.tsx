import type { ReactNode } from "react"
import { alpha, List, ListSubheader, styled } from "@mui/material"

type PageSectionTone = "default" | "danger"

// `styled` drops ListSubheader's polymorphic `component` prop from its type.
const SectionListSubheader = styled(ListSubheader)(
  function styleSectionListSubheader({ theme }) {
    return {
      backgroundColor: "transparent",
      [theme.breakpoints.up("md")]: {
        paddingLeft: theme.spacing(4),
        lineHeight: theme.spacing(5),
      },
    }
  },
) as typeof ListSubheader

// `styled` drops ListSubheader's polymorphic `component` prop from its type.
const DangerSectionListSubheader = styled(SectionListSubheader)(
  function styleDangerSectionListSubheader({ theme }) {
    return {
      color: theme.palette.error.dark,
      backgroundColor: alpha(theme.palette.error.light, 0.2),
      [theme.breakpoints.up("md")]: {
        backgroundColor: "transparent",
      },
    }
  },
) as typeof ListSubheader

const SectionList = styled(List)(function styleSectionList({ theme }) {
  return {
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(1, 2, 3),
      padding: 0,
      overflow: "hidden",
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.5),
    },
  }
})

const DangerSectionList = styled(SectionList)(function styleDangerSectionList({
  theme,
}) {
  return {
    backgroundColor: alpha(theme.palette.error.light, 0.2),
    [theme.breakpoints.up("md")]: {
      borderColor: alpha(theme.palette.error.main, 0.4),
    },
  }
})

/**
 * A titled group of list rows. Below the `md` breakpoint the rows span the
 * screen, as a plain `List` renders them; from `md`, where the app switches
 * to its desktop layout, the group is an outlined card in the page column.
 * Sits in a `PageContainer` with `disableGutters`.
 */
export function PageSection({
  title,
  tone = "default",
  children,
}: {
  title?: ReactNode
  tone?: PageSectionTone
  children: ReactNode
}) {
  const isDanger = tone === "danger"
  const hasTitle = Boolean(title)
  const Subheader = isDanger ? DangerSectionListSubheader : SectionListSubheader
  const Rows = isDanger ? DangerSectionList : SectionList

  return (
    <>
      {hasTitle && (
        <Subheader component="div" disableSticky>
          {title}
        </Subheader>
      )}
      <Rows sx={hasTitle ? { pt: 0 } : undefined}>{children}</Rows>
    </>
  )
}
