"use client"

import { Chip, Container, Stack, styled } from "@mui/material"
import { useEffect, useState } from "react"

const SectionNav = styled("nav")(function styleSectionNav({ theme }) {
  return {
    position: "sticky",
    top: 56,
    zIndex: theme.zIndex.appBar - 1,
    backgroundColor: theme.alpha(theme.vars.palette.background.paper, 0.9),
    backdropFilter: "blur(8px)",
    borderTop: `1px solid ${theme.vars.palette.divider}`,
    borderBottom: `1px solid ${theme.vars.palette.divider}`,
    [theme.breakpoints.up("sm")]: {
      top: 64,
    },
  }
})

const SectionNavStack = styled(Stack)(function styleSectionNavStack({ theme }) {
  return {
    flexDirection: "row",
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    overflowX: "auto",
    scrollbarWidth: "none",
    [theme.breakpoints.up("md")]: {
      justifyContent: "center",
    },
  }
})

type FeatureSectionLink = {
  id: string
  navLabel: string
}

/** A section is the current one while it crosses a line 40% down the viewport. */
const CURRENT_SECTION_LINE_ROOT_MARGIN = "-40% 0px -60% 0px"

function scrollChipToNavCenter(chip: HTMLElement | null) {
  const navStack = chip?.parentElement

  if (!chip || !navStack) return

  const chipRect = chip.getBoundingClientRect()
  const navStackRect = navStack.getBoundingClientRect()
  const chipCenter = chipRect.left + chipRect.width / 2
  const navStackCenter = navStackRect.left + navStackRect.width / 2

  navStack.scrollBy({ left: chipCenter - navStackCenter, behavior: "smooth" })
}

export function FeatureSectionNav({
  sections,
}: {
  sections: FeatureSectionLink[]
}) {
  const [sectionIdsOnLine, setSectionIdsOnLine] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const currentSectionId = sections.find(({ id }) =>
    sectionIdsOnLine.has(id),
  )?.id

  useEffect(
    function trackSectionsOnCurrentSectionLine() {
      const observer = new IntersectionObserver(
        function recordSectionsCrossingLine(entries) {
          setSectionIdsOnLine(function applyCrossings(idsOnLine) {
            const nextIdsOnLine = new Set(idsOnLine)

            for (const { isIntersecting, target } of entries) {
              if (isIntersecting) {
                nextIdsOnLine.add(target.id)
              } else {
                nextIdsOnLine.delete(target.id)
              }
            }

            return nextIdsOnLine
          })
        },
        { rootMargin: CURRENT_SECTION_LINE_ROOT_MARGIN },
      )

      for (const { id } of sections) {
        const section = document.getElementById(id)

        if (!section) {
          throw new Error(`The page has no section with the id "${id}"`)
        }

        observer.observe(section)
      }

      return function stopTrackingSections() {
        observer.disconnect()
      }
    },
    [sections],
  )

  return (
    <SectionNav aria-label="Feature categories">
      <Container>
        <SectionNavStack>
          {sections.map(function renderSectionLink({ id, navLabel }) {
            const isCurrent = id === currentSectionId

            return (
              <Chip
                key={id}
                ref={isCurrent ? scrollChipToNavCenter : undefined}
                label={navLabel}
                component="a"
                href={`#${id}`}
                aria-current={isCurrent ? "location" : undefined}
                clickable
                color={isCurrent ? "primary" : "default"}
                variant={isCurrent ? "filled" : "outlined"}
              />
            )
          })}
        </SectionNavStack>
      </Container>
    </SectionNav>
  )
}
