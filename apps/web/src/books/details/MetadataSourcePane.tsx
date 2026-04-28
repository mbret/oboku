import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  styled,
} from "@mui/material"
import {
  Google,
  InsertLinkOutlined,
  MoreVertRounded,
  PersonOutlineOutlined,
  PlagiarismOutlined,
} from "@mui/icons-material"
import type { FC } from "react"
import { useBook } from "../states"
import type { BookMetadata } from "@oboku/shared"
import { useLink } from "../../links/states"
import { pluginsByType } from "../../plugins/configure"

// Cast preserves Typography's polymorphic `component` prop, which MUI's
// `styled` otherwise erases.
const PluginNameTypography = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(1),
})) as typeof Typography

const WarningTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.warning.main,
})) as typeof Typography

const TrailingIconStack = styled(Stack)({
  width: 50,
  alignItems: "center",
  flexShrink: 0,
})

export const MetadataSourcePane: FC<{ bookId: string }> = ({ bookId }) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const plugin = link?.type ? pluginsByType[link?.type] : undefined
  const types: BookMetadata["type"][] = [
    "user",
    "file",
    "googleBookApi",
    "link",
  ]

  return (
    <List
      dense
      subheader={<ListSubheader>Metadata Sources</ListSubheader>}
      disablePadding
    >
      {types.map((type) => {
        const metadata = book?.metadata?.find((item) => item.type === type)

        const numberOfProperties = metadata
          ? Object.keys(metadata).filter(
              (key) => metadata[key as keyof typeof metadata] !== undefined,
            ).length
          : 0

        return (
          <ListItemButton key={type}>
            <ListItemIcon>
              {type === "file" && <PlagiarismOutlined />}
              {type === "link" && <InsertLinkOutlined />}
              {type === "user" && <PersonOutlineOutlined />}
              {type === "googleBookApi" && <Google />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography>
                  {type === "file"
                    ? "File"
                    : type === "googleBookApi"
                      ? "Google Book API"
                      : type === "user"
                        ? "User"
                        : "Link"}
                  {type === "link" && (
                    <PluginNameTypography component="span" variant="body2">
                      ({plugin?.name})
                    </PluginNameTypography>
                  )}
                </Typography>
              }
              secondary={
                !numberOfProperties ? (
                  <>
                    {type === "user" && (
                      <WarningTypography variant="body2">
                        No information entered yet
                      </WarningTypography>
                    )}
                    {type !== "user" && (
                      <WarningTypography variant="body2">
                        No data yet
                      </WarningTypography>
                    )}
                  </>
                ) : (
                  <Stack>
                    <Typography variant="body2">
                      {numberOfProperties} properties
                      {type === "file" ? " gathered from the file itself" : ""}
                    </Typography>
                    <Typography variant="caption">
                      {type === "file" && metadata?.contentType
                        ? `${metadata.contentType}, `
                        : ""}
                      {metadata?.title ? `${metadata.title}, ` : ""}...
                    </Typography>
                  </Stack>
                )
              }
              slotProps={{
                secondary: {
                  component: "div",
                },
              }}
            />
            <TrailingIconStack>
              <MoreVertRounded />
            </TrailingIconStack>
          </ListItemButton>
        )
      })}
    </List>
  )
}
