import { ExpandMore } from "@mui/icons-material"
import {
  Accordion as MuiAccordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  styled,
  Typography,
  useTheme
} from "@mui/material"
import makeStyles from "@mui/styles/makeStyles"
import { bind } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  generatePath,
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom"
import { useMount } from "react-use"
import { BookList } from "../books/bookList/BookList"
import { CollectionList } from "../collections/list/CollectionList"
import { useCSS } from "../common/utils"
import { ROUTES } from "../constants"
import { SEARCH_MAX_PREVIEW_ITEMS } from "../constants.shared"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useDatabase } from "../rxdb"
import { useBooks, useCollections } from "./states"

export const [searchChange$, setSearch] = createSignal<string>()

export const [useSearchValue, search$] = bind(searchChange$, "")

const Accordion = styled(MuiAccordion)({
  ":before": {
    backgroundColor: "transparent"
  }
})

const SeeMore = ({
  size,
  search,
  type
}: {
  size?: number
  search: string
  type: "book" | "collection"
}) => {
  return (
    <List>
      <ListItemButton
        style={{ justifyContent: "center" }}
        component={Link}
        to={generatePath(`:search/:type`, {
          search,
          type
        })}
      >
        <ListItemText
          style={{ textAlign: "center" }}
          primary={`See more (${size ?? 0} results)`}
        />
      </ListItemButton>
    </List>
  )
}

export const SearchScreen = () => {
  const { styles, classes } = useStyles()
  const { db$ } = useDatabase()
  const [searchParams, setSearchParams] = useSearchParams()
  const value = useSearchValue()
  const collections = useCollections(db$, search$)
  const books = useBooks(db$, search$)
  const inputRef = useRef<HTMLElement>()
  const navigate = useNavigate()
  const [bookExpanded, setBookExpanded] = useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = useState(true)

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    inputRef.current?.blur()
  }, [])

  useMount(() => {
    setSearch(searchParams.get("value") || "")
  })

  return (
    <div style={styles.container}>
      <TopBarNavigation
        showBack
        rightComponent={
          <form style={styles.search} autoComplete="off" onSubmit={onSubmit}>
            <InputBase
              placeholder="Alice in wonderland, myTag, ..."
              value={value || ""}
              inputRef={inputRef as any}
              autoFocus
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput
              }}
              inputProps={{ "aria-label": "search" }}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchParams(
                  {
                    value: e.target.value
                  },
                  {
                    replace: true
                  }
                )
              }}
            />
          </form>
        }
      />
      <Box overflow="scroll">
        <Accordion
          disableGutters
          elevation={0}
          expanded={bookExpanded}
          onChange={(_, expanded) => setBookExpanded(expanded)}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Books ({books.length ?? 0})</Typography>
          </AccordionSummary>
          <AccordionDetails
            {...(books.length && {
              style: {
                padding: 0
              }
            })}
          >
            <Box height="auto">
              {books.length ? (
                <>
                  <BookList
                    data={books.slice(0, SEARCH_MAX_PREVIEW_ITEMS)}
                    viewMode="list"
                    static
                  />
                  {(books.length ?? 0) > SEARCH_MAX_PREVIEW_ITEMS && (
                    <SeeMore size={books.length} search={value} type="book" />
                  )}
                </>
              ) : (
                <Typography>No results</Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion
          disableGutters
          style={{ border: "none" }}
          elevation={0}
          expanded={collectionsExpanded}
          onChange={(_, expanded) => setCollectionsExpanded(expanded)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>Collections ({collections.length ?? 0})</Typography>
          </AccordionSummary>
          <AccordionDetails
            {...(collections.length && {
              style: {
                padding: 0
              }
            })}
          >
            {collections.length ? (
              <>
                <CollectionList
                  data={collections.slice(0, SEARCH_MAX_PREVIEW_ITEMS)}
                  viewMode="list"
                  static
                  onItemClick={({ _id }) => {
                    navigate(ROUTES.COLLECTION_DETAILS.replace(":id", _id))
                  }}
                />
                {(collections.length ?? 0) > SEARCH_MAX_PREVIEW_ITEMS && (
                  <SeeMore
                    size={collections.length}
                    search={value}
                    type="collection"
                  />
                )}
              </>
            ) : (
              <Typography>No results</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </div>
  )
}

const useClasses = makeStyles((theme) => ({
  inputRoot: {
    color: "inherit",
    width: "100%"
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 1),
    width: "100%"
  }
}))

const useStyles = () => {
  const theme = useTheme()
  const classes = useClasses()

  const styles = useCSS(
    () => ({
      container: {
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        flex: 1,
        height: "100%"
      },
      search: {
        position: "relative",
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        "&:hover": {
          backgroundColor: alpha(theme.palette.common.white, 0.25)
        },
        marginLeft: 0,
        width: "100%"
      }
    }),
    [theme]
  )

  return { styles, classes }
}
