import { Stack, Typography, styled } from "@mui/material"
import { TestBookButton } from "./TestBookButton"

const ContentTabRootStack = styled(Stack)(({ theme }) => ({
  flex: 1,
  minHeight: 0,
  gap: theme.spacing(2),
}))

const ActionsStack = styled(Stack)(({ theme }) => ({
  marginTop: "auto",
  gap: theme.spacing(1),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}))

type Props = {
  bookId: string
  hidden: boolean
}

export function ContentTab({ bookId, hidden }: Props) {
  return (
    <ContentTabRootStack hidden={hidden}>
      <Typography variant="body2" color="text.secondary">
        Coming soon
      </Typography>
      <ActionsStack>
        <TestBookButton bookId={bookId} />
      </ActionsStack>
    </ContentTabRootStack>
  )
}
