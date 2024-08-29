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
import React, { useCallback, useMemo, useRef, useState } from "react"
import {
  generatePath,
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom"
import { useMount } from "react-use"
import { BookList } from "../books/bookList/BookList"
import { CollectionList } from "../collections/list/CollectionList"
import { ROUTES } from "../constants"
import { SEARCH_MAX_PREVIEW_ITEMS } from "../constants.shared"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useCollectionsForSearch } from "./useCollectionsForSearch"
import { useSignalValue } from "reactjrx"
import { useBooksForSearch } from "./useBooksForSearch"
import { ListActionsToolbar } from "./list/ListActionsToolbar"
import { searchStateSignal } from "./states"

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
          // will use /%20/ (space) instead of nothing and crashing
          search: search === `` ? ` ` : search,
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

const SearchInput = styled(InputBase)(({ theme }) => ({
  ".MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 1),
    width: "100%"
  }
}))

const StyledForm = styled(`form`)(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25)
  },
  marginLeft: 0,
  width: "100%"
}))

export const SearchScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = useSignalValue(searchStateSignal)
  const { data: collections = [] } = useCollectionsForSearch(value)
  const { data: books = [] } = useBooksForSearch(value)
  const inputRef = useRef<HTMLElement>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [bookExpanded, setBookExpanded] = useState(true)
  const [collectionsExpanded, setCollectionsExpanded] = useState(true)

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    inputRef.current?.blur()
  }, [])

  useMount(() => {
    searchStateSignal.setValue(searchParams.get("value") || "")
  })

  const visibleCollections = useMemo(
    () => collections.slice(0, SEARCH_MAX_PREVIEW_ITEMS),
    [collections]
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        flex: 1,
        height: "100%"
      }}
    >
      <TopBarNavigation
        showBack
        middleComponent={
          <StyledForm autoComplete="off" onSubmit={onSubmit}>
            <SearchInput
              placeholder="Alice in wonderland, myTag, ..."
              value={value || ""}
              sx={{
                color: "inherit",
                width: "100%"
              }}
              inputRef={inputRef as any}
              autoFocus
              inputProps={{ "aria-label": "search" }}
              onChange={(e) => {
                searchStateSignal.setValue(e.target.value)
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
          </StyledForm>
        }
      />
      <ListActionsToolbar />
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
                  data={visibleCollections}
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
