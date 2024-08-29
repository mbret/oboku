import { memo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { capitalize, Stack } from "@mui/material"
import { plugins } from "./configure"
import { useParams } from "react-router-dom"

export const PluginScreen = memo(() => {
  const { type } = useParams<{ type: string }>()

  const plugin = plugins.find((plugin) => plugin.type === type)

  return (
    <>
      <Stack flex={1} overflow="scroll">
        <TopBarNavigation
          title={capitalize(plugin?.name ?? "plugin")}
          showBack
        />
        {!!plugin?.InfoScreen && <plugin.InfoScreen />}
      </Stack>
    </>
  )
})
