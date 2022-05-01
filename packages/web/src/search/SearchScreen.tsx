import { alpha, InputBase, makeStyles, useTheme } from "@material-ui/core"
import React, { useCallback, useEffect, useRef } from "react"
import { BookList } from "../books/bookList/BookList"
import { useCSS } from "../common/utils"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { useSearch } from "./helpers"

export const SearchScreen = () => {
  const { styles, classes } = useStyles()
  const [value, search, results] = useSearch()
  const inputRef = useRef<HTMLElement>()

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    inputRef.current?.blur()
  }, [])

  useEffect(() => {
    return () => {
      search(``)
    }
  }, [search])

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
                search(e.target.value)
              }}
            />
          </form>
        }
      />
      <BookList
        data={results.map((book) => book._id)}
        viewMode="list"
        style={{
          height: "100%",
          overflow: "hidden"
        }}
      />
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
