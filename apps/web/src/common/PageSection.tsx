import type { ReactNode } from "react"
import { alpha, Box, List, ListSubheader, Stack, styled } from "@mui/material"

type PageSectionTone = "default" | "danger"

type PageSectionVariant = "list" | "stack"

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

const SectionCardBox = styled(Box)(function styleSectionCardBox({ theme }) {
  return {
    [theme.breakpoints.up("md")]: {
      margin: theme.spacing(1, 2, 3),
      overflow: "hidden",
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1.5),
    },
  }
})

const DangerSectionCardBox = styled(SectionCardBox)(
  function styleDangerSectionCardBox({ theme }) {
    return {
      backgroundColor: alpha(theme.palette.error.light, 0.2),
      [theme.breakpoints.up("md")]: {
        borderColor: alpha(theme.palette.error.main, 0.4),
      },
    }
  },
)

const SectionList = styled(List)(function styleSectionList({ theme }) {
  return {
    [theme.breakpoints.up("md")]: {
      padding: 0,
    },
  }
})

const SectionStack = styled(Stack)(function styleSectionStack({ theme }) {
  return {
    gap: theme.spacing(2),
    padding: theme.spacing(2),
  }
})

/**
 * A titled group in the page column. Below the `md` breakpoint it spans the
 * screen, as a plain `List` renders its rows; from `md`, where the app
 * switches to its desktop layout, the group is an outlined card in the page
 * column. Sits in a `PageContainer` with `disableGutters`.
 *
 * The `list` variant holds list rows, which bring their own padding. The
 * `stack` variant holds other blocks, such as form fields, and pads them to
 * the rows' edge.
 */
export function PageSection({
  title,
  tone = "default",
  variant = "list",
  dense,
  children,
}: {
  title?: ReactNode
  tone?: PageSectionTone
  variant?: PageSectionVariant
  /** Passed to the `list` variant's `List`. */
  dense?: boolean
  children: ReactNode
}) {
  const isDanger = tone === "danger"
  const hasTitle = Boolean(title)
  const Subheader = isDanger ? DangerSectionListSubheader : SectionListSubheader
  const Card = isDanger ? DangerSectionCardBox : SectionCardBox

  return (
    <>
      {hasTitle && (
        <Subheader component="div" disableSticky>
          {title}
        </Subheader>
      )}
      <Card>
        {variant === "stack" ? (
          <SectionStack>{children}</SectionStack>
        ) : (
          <SectionList dense={dense} sx={hasTitle ? { pt: 0 } : undefined}>
            {children}
          </SectionList>
        )}
      </Card>
    </>
  )
}
