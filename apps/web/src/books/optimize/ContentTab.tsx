import { Stack, Typography, styled } from "@mui/material"

const ContentTabRootStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

type Props = {
  hidden: boolean
}

export function ContentTab({ hidden }: Props) {
  return (
    <ContentTabRootStack hidden={hidden}>
      <Typography variant="body2" color="text.secondary">
        Coming soon
      </Typography>
    </ContentTabRootStack>
  )
}
