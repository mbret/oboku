import { styled } from "@mui/material"
import { PageContainer } from "../../common/PageContainer"

export const OptimizePageContainer = styled(PageContainer)(
  function styleOptimizePageContainer({ theme }) {
    return {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      gap: theme.spacing(2),
    }
  },
)
