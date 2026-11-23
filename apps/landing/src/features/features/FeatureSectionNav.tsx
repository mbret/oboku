"use client"

import { Chip, Container, Stack, styled } from "@mui/material"
import { useEffect, useState } from "react"
import type { FeatureGroup } from "./content"
import { sectionScrollMargin } from "./FeatureGroupSection.styled"

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

type FeatureSectionLink = Pick<FeatureGroup, "id" | "navLabel">

/**
 * From just below where a chip scrolls its section to, so the section above
 * stays out, down to 60% of the viewport.
 */
const ON_SCREEN_BAND_ROOT_MARGIN = `-${sectionScrollMargin + 1}px 0px -40% 0px`

function centerChipInNav(chip: HTMLElement | null) {
  chip?.scrollIntoView({
    block: "nearest",
    inline: "center",
    behavior: "smooth",
  })
}

export function FeatureSectionNav({
  sections,
}: {
  sections: FeatureSectionLink[]
}) {
  const [sectionIdsInBand, setSectionIdsInBand] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const currentSectionId = sections.find(({ id }) =>
    sectionIdsInBand.has(id),
  )?.id

  useEffect(
    function trackSectionsInOnScreenBand() {
      const observer = new IntersectionObserver(
        function recordSectionsCrossingBand(entries) {
          setSectionIdsInBand(function applyCrossings(idsInBand) {
            const nextIdsInBand = new Set(idsInBand)

            for (const { isIntersecting, target } of entries) {
              if (isIntersecting) {
                nextIdsInBand.add(target.id)
              } else {
                nextIdsInBand.delete(target.id)
              }
            }

            return nextIdsInBand
          })
        },
        { rootMargin: ON_SCREEN_BAND_ROOT_MARGIN },
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
                ref={isCurrent ? centerChipInNav : undefined}
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
