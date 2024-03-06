import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography
} from "@mui/material"
import {
  Google,
  InsertLinkOutlined,
  MoreVertRounded,
  PersonOutlineOutlined,
  PlagiarismOutlined
} from "@mui/icons-material"
import { FC } from "react"
import { useBook } from "../states"
import { Metadata } from "@oboku/shared"
import { useLink } from "../../links/states"
import { getPluginFromType } from "../../plugins/getPluginFromType"

export const MetadataSourcePane: FC<{ bookId: string }> = ({ bookId }) => {
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const plugin = getPluginFromType(link?.type)
  const types: Metadata["type"][] = ["user", "file", "googleBookApi", "link"]

  return (
    <>
      <List subheader={<ListSubheader>Metadata sources</ListSubheader>}>
        {types.map((type) => {
          const metadata = book?.metadata?.find((item) => item.type === type)

          const numberOfProperties = metadata
            ? Object.keys(metadata).filter((key) => metadata[key] !== undefined)
                .length
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
                      <Typography component="span" variant="body2" ml={1}>
                        ({plugin?.name})
                      </Typography>
                    )}
                  </Typography>
                }
                secondaryTypographyProps={{
                  component: "div"
                }}
                secondary={
                  !numberOfProperties ? (
                    <>
                      {type === "user" && (
                        <Typography variant="body2" color="warning.main">
                          No information entered yet
                        </Typography>
                      )}
                      {type !== "user" && (
                        <Typography variant="body2" color="warning.main">
                          No data yet
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Stack>
                      <Typography variant="body2">
                        {numberOfProperties} properties
                        {type === "file"
                          ? " gathered from the file itself"
                          : ""}
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
              />
              <Stack width={50} alignItems="center" flexShrink={0}>
                <MoreVertRounded />
              </Stack>
            </ListItemButton>
          )
        })}
      </List>
    </>
  )
}
