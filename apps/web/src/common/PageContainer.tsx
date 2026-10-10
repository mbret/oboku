import {
  Container,
  type ContainerProps,
  containerClasses,
  styled,
} from "@mui/material"

// MUI widens a container's gutters from the `sm` breakpoint while list rows
// keep theirs: holding the gutters at the rows' width keeps forms and lists
// on the same edge.
const LeftAlignedContainer = styled(Container)(
  function styleLeftAlignedContainer({ theme }) {
    return {
      marginLeft: 0,
      [`&:not(.${containerClasses.disableGutters})`]: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
      },
    }
  },
)

/**
 * The column a screen's content sits in below its top bar: aligned with the
 * top bar's start and capped at a readable width on wide screens, for forms
 * and lists alike. Lists pass `disableGutters` to keep their rows' own
 * padding.
 */
export function PageContainer(props: ContainerProps) {
  return <LeftAlignedContainer maxWidth="md" {...props} />
}
