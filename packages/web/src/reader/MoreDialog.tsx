import {
  Collapse,
  Dialog,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  useTheme
} from "@mui/material"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { FiberManualRecordRounded } from "@mui/icons-material"
import React, { useCallback } from "react"
import { FC } from "react"
import { useCSS } from "../common/utils"
import { DialogTopBar } from "../navigation/DialogTopBar"
import { usePagination, useCurrentPage, readerStateSignal } from "./states"
import { SettingsList } from "./settings/SettingsList"
import { signal, useObserve, useSignalValue } from "reactjrx"
import { NEVER } from "rxjs"

const isContentsDialogOpenedStateSignal = signal<boolean>({
  key: "isContentsDialogOpenedState",
  default: false
})

export const useMoreDialog = () => ({
  toggleMoreDialog: useCallback(() => {
    isContentsDialogOpenedStateSignal.setValue((val) => !val)
  }, [])
})

export const MoreDialog: FC<{}> = () => {
  const isContentsDialogOpened = useSignalValue(
    isContentsDialogOpenedStateSignal
  )
  const { toggleMoreDialog } = useMoreDialog()
  const [value, setValue] = React.useState("toc")
  const reader = useSignalValue(readerStateSignal)
  const { data: pagination } = usePagination()
  const { manifest } = useObserve(reader?.context.state$ ?? NEVER) || {}
  const { title, nav } = manifest ?? {}
  const chapterInfo = pagination?.beginChapterInfo
  const currentPage = useCurrentPage() || 0
  const toc = nav?.toc || []
  const styles = useStyles()

  const theme = useTheme()

  let currentSubChapter = chapterInfo

  while (currentSubChapter?.subChapter) {
    currentSubChapter = currentSubChapter?.subChapter
  }

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  const buildTocForItem = (
    tocItem: (typeof toc)[number],
    index: number,
    lvl: number
  ) => (
    <React.Fragment key={index}>
      <ListItem button style={{}}>
        <ListItemIcon>
          {currentSubChapter?.path === tocItem.path && (
            <FiberManualRecordRounded color="primary" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={tocItem.title}
          {...{
            ...(currentSubChapter?.path === tocItem.path && {
              secondary: `Currently on page ${currentPage + 1}`
            })
          }}
          color="primary"
          onClick={() => {
            toggleMoreDialog()
            reader?.viewportNavigator.goToUrl(tocItem.href)
          }}
          style={{
            paddingLeft: theme.spacing(lvl * 2)
          }}
        />
        {/* {tocItem.contents.length > 0 && (
          <ExpandLessRounded />
        )} */}
      </ListItem>
      {tocItem.contents.length > 0 && (
        <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {tocItem.contents.map((tocItem, index) =>
              buildTocForItem(tocItem, index, lvl + 1)
            )}
          </List>
        </Collapse>
      )}
    </React.Fragment>
  )

  return (
    <TabContext value={value}>
      <Dialog
        onClose={toggleMoreDialog}
        open={isContentsDialogOpened}
        fullScreen
      >
        <DialogTopBar title={title} onClose={toggleMoreDialog} />
        <TabList
          style={styles.tabsContainer}
          onChange={handleChange}
          indicatorColor="primary"
        >
          <Tab label="Chapters" value="toc" />
          <Tab label="Settings" value="settings" />
        </TabList>
        <DialogContent style={styles.container}>
          <TabPanel value="toc" sx={{ padding: 0 }}>
            <List component="nav" style={styles.root}>
              {toc.map((tocItem, index) => buildTocForItem(tocItem, index, 0))}
            </List>
          </TabPanel>
          <TabPanel value="settings" sx={{ padding: 0 }}>
            <SettingsList />
          </TabPanel>
        </DialogContent>
      </Dialog>
    </TabContext>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      container: {
        padding: 0
      },
      tabsContainer: {
        border: `1px solid ${theme.palette.primary.light}`,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none"
      },
      root: {}
    }),
    [theme]
  )
}
