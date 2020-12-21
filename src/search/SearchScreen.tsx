import { Box, createStyles, fade, InputBase, List, ListItem, makeStyles, Theme } from '@material-ui/core'
import React from 'react'
import { BookListListItem } from '../books/BookListListItem'
import { TopBarNavigation } from '../TopBarNavigation'
import { useSearch } from './helpers'

export const SearchScreen = () => {
  const classes = useStyles()
  const [search, setSearch, results] = useSearch()

  return (
    <Box>
      <TopBarNavigation showBack rightComponent={(
        <div className={classes.search} >
          <InputBase
            placeholder="Alice in wonderland, myTag, ..."
            value={search || ''}
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            inputProps={{ 'aria-label': 'search' }}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )} />
      <List>
        {results.map(book => (
          <ListItem key={book._id}>
            <BookListListItem bookId={book._id} size="small" />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

const useStyles = makeStyles((theme: Theme) => {

  return createStyles({
    search: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.15),
      '&:hover': {
        backgroundColor: fade(theme.palette.common.white, 0.25),
      },
      marginLeft: 0,
      width: '100%',
    },
    inputRoot: {
      color: 'inherit',
      width: '100%',
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 1),
      width: '100%',
    },
  })
});