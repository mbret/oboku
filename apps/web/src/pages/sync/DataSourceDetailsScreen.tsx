import { Box } from "@mui/material"
import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { useParams } from "react-router"
import { plugins } from "../../dataSources"
import { useDataSource } from "../../dataSources/useDataSource"

export const DataSourceDetailsScreen = memo(() => {
  const { id } = useParams<{ id: string }>()
  const { data: dataSource } = useDataSource(id)
  const obokuPlugin = plugins.find(
    (p) => p.type.toLowerCase() === dataSource?.type.toLowerCase(),
  )
  const { name = id ?? "" } = obokuPlugin?.useSyncSourceInfo?.(dataSource) ?? {}
  const DetailsComponent = obokuPlugin?.DataSourceDetails ?? (() => null)

  return (
    <Box display="flex" flex={1} overflow="auto" flexDirection="column">
      <TopBarNavigation title={`${name}`} />
      <DetailsComponent />
    </Box>
  )
})
