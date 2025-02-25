import {
  Collapse,
  Dialog,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tab,
  useTheme,
} from "@mui/material"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { FiberManualRecordRounded } from "@mui/icons-material"
import React, { memo, useCallback } from "react"
import { DialogTopBar } from "../../navigation/DialogTopBar"
import { usePagination, readerSignal } from "../states"
import { SettingsList } from "../settings/SettingsList"
import { signal, useObserve, useSignalValue } from "reactjrx"
import { useCurrentPages } from "../pagination/useCurrentPages"

const isContentsDialogOpenedStateSignal = signal<boolean>({
  key: "isContentsDialogOpenedState",
  default: false,
})

export const useMoreDialog = () => ({
  toggleMoreDialog: useCallback(() => {
    isContentsDialogOpenedStateSignal.setValue((val) => !val)
  }, []),
})

export const MoreDialog = memo(({ bookId }: { bookId?: string }) => {
  const isContentsDialogOpened = useSignalValue(
    isContentsDialogOpenedStateSignal,
  )
  const { toggleMoreDialog } = useMoreDialog()
  const theme = useTheme()
  const [value, setValue] = React.useState("toc")
  const reader = useSignalValue(readerSignal)
  const { data: pagination } = usePagination()
  const { manifest } = useObserve(() => reader?.context.state$, [reader]) || {}
  const { title, nav } = manifest ?? {}
  const chapterInfo = pagination?.beginChapterInfo
  const [currentPage] = useCurrentPages({ bookId }) || 0
  const toc = nav?.toc || []

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
    lvl: number,
  ) => (
    <React.Fragment key={index}>
      <ListItemButton style={{}}>
        <ListItemIcon>
          {currentSubChapter?.path === tocItem.path && (
            <FiberManualRecordRounded color="primary" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={tocItem.title}
          {...{
            ...(currentSubChapter?.path === tocItem.path && {
              secondary: `Currently on page ${(currentPage ?? 0) + 1}`,
            }),
          }}
          color="primary"
          onClick={() => {
            toggleMoreDialog()
            reader?.navigation.goToUrl(tocItem.href)
          }}
          style={{
            paddingLeft: theme.spacing(lvl * 2),
          }}
        />
        {/* {tocItem.contents.length > 0 && (
          <ExpandLessRounded />
        )} */}
      </ListItemButton>
      {tocItem.contents.length > 0 && (
        <Collapse in={true} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {tocItem.contents.map((tocItem, index) =>
              buildTocForItem(tocItem, index, lvl + 1),
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
          style={{
            border: `1px solid ${theme.palette.primary.light}`,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
          }}
          onChange={handleChange}
          indicatorColor="primary"
        >
          <Tab label="Chapters" value="toc" />
          <Tab label="Settings" value="settings" />
        </TabList>
        <DialogContent
          style={{
            padding: 0,
          }}
        >
          <TabPanel value="toc" sx={{ padding: 0 }}>
            <List component="nav">
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
})
