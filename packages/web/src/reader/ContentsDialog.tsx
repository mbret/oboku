import { Collapse, Dialog, DialogContent, List, ListItem, ListItemIcon, ListItemText, Tab, Tabs, useTheme } from '@material-ui/core';
import { FiberManualRecordRounded } from '@material-ui/icons';
import React from 'react';
import { FC } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';
import { useCSS } from '../common/utils';
import { DialogTopBar } from '../navigation/DialogTopBar';
import { useReader } from './ReaderProvider';
import { manifestState, chapterInfoState, currentPageState } from './states';

const isContentsDialogOpenedState = atom<boolean>({ key: 'isContentsDialogOpenedState', default: false })

export const useToggleContentsDialog = () => useRecoilCallback(({ set }) => () => {
  set(isContentsDialogOpenedState, val => !val)
}, [])

export const ContentsDialog: FC<{}> = () => {
  const isContentsDialogOpened = useRecoilValue(isContentsDialogOpenedState)
  const toggleContentsDialog = useToggleContentsDialog()
  const { title, nav } = useRecoilValue(manifestState) || {}
  const chapterInfo = useRecoilValue(chapterInfoState)
  const currentPage = useRecoilValue(currentPageState) || 0
  const toc = nav?.toc || []
  const styles = useStyles()
  const reader = useReader()
  const theme = useTheme()

  let currentSubChapter = chapterInfo

  while (currentSubChapter?.subChapter) {
    currentSubChapter = currentSubChapter?.subChapter
  }

  const buildTocForItem = (tocItem: typeof toc[number], index: number, lvl: number) => (
    <React.Fragment key={index}>
      <ListItem button style={{
      }}>
        <ListItemIcon>
          {currentSubChapter?.path === tocItem.path && <FiberManualRecordRounded color="primary" />}
        </ListItemIcon>
        <ListItemText
          primary={tocItem.title}
          {...{
            ...currentSubChapter?.path === tocItem.path && {
              secondary: `Currently on page ${currentPage + 1}`
            }
          }}
          color="primary"
          onClick={() => {
            toggleContentsDialog()
            reader?.goToHref(tocItem.href)
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
            {tocItem.contents.map((tocItem, index) => buildTocForItem(tocItem, index, lvl + 1))}
          </List>
        </Collapse>
      )}
    </React.Fragment>
  )

  return (
    <Dialog
      onClose={toggleContentsDialog}
      open={isContentsDialogOpened}
      fullScreen
    >
      <DialogTopBar title={title} onClose={toggleContentsDialog} />
      <Tabs
        style={styles.tabsContainer}
        value="toc"
        indicatorColor="primary"
      >
        <Tab label="Chapters" value="toc" disableFocusRipple disableRipple disableTouchRipple />
      </Tabs>
      <DialogContent style={styles.container}>
        <List
          component="nav"
          style={styles.root}
        >
          {toc.map((tocItem, index) => buildTocForItem(tocItem, index, 0))}
        </List>
      </DialogContent>
    </Dialog>
  )
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      padding: 0,
    },
    tabsContainer: {
      border: `1px solid ${theme.palette.primary.light}`,
      borderTop: 'none', borderLeft: 'none', borderRight: 'none'
    },
    root: {},
  }), [theme])
}