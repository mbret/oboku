import { Box, fade, InputBase, makeStyles, useTheme } from '@material-ui/core'
import React, { useMemo } from 'react'
import { BookList } from '../books/bookList/BookList'
import { TopBarNavigation } from '../TopBarNavigation'
import { useSearch } from './helpers'

export const SearchScreen = () => {
  const { styles, classes } = useStyles()
  const [search, setSearch, results] = useSearch()

  return (
    <Box display="flex" flexDirection="column" overflow="hidden" flex={1} height="100%">
      <TopBarNavigation showBack rightComponent={(
        <div style={styles.search} >
          <InputBase
            placeholder="Alice in wonderland, myTag, ..."
            value={search || ''}
            autoFocus
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{ 'aria-label': 'search' }}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )} />
      <BookList
        data={results.map(book => book._id)}
        viewMode="list"
        style={{
          height: '100%',
          overflow: 'hidden',
        }}
      />
    </Box>
  )
}

const useClasses = makeStyles(theme => ({
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 1),
    width: '100%',
  },
}))

const useStyles = () => {
  const theme = useTheme()
  const classes = useClasses()

  const styles = useMemo(() => {
    return {
      search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
          backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        width: '100%',
      } as React.CSSProperties,
    }
  }, [theme])

  return { styles, classes }
};