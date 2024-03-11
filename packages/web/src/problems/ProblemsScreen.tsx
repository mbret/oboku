import { Box, List, ListItem, ListItemIcon, ListItemText } from "@mui/material"
import { difference, groupBy } from "lodash"
import { Fragment, memo, useMemo } from "react"
import { Report } from "../debug/report.shared"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { BuildRounded } from "@mui/icons-material"
import { useFixCollections } from "./useFixCollections"
import { useFixBookReferences } from "./useFixBookReferences"
import { useDuplicatedResourceIdLinks } from "./useDuplicateLinks"
import { useFixBooksDanglingLinks } from "./useFixBooksDanglingLinks"
import { useBooksDanglingLinks } from "./useBooksDanglingLinks"
import {
  useDuplicatedBookTitles,
  useFixDuplicatedBookTitles
} from "./useDuplicateBooksTitles"
import { Alert } from "@mui/material"
import { useObserve } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { switchMap } from "rxjs"
import { getMetadataFromCollection } from "../collections/getMetadataFromCollection"

export const ProblemsScreen = memo(() => {
  const fixCollections = useFixCollections()
  const fixBookReferences = useFixBookReferences()
  const fixBooksDanglingLinks = useFixBooksDanglingLinks()
  const duplicatedLinks = useDuplicatedResourceIdLinks()
  const duplicatedBookTitles = useDuplicatedBookTitles()
  const fixDuplicatedBookTitles = useFixDuplicatedBookTitles()
  const collections = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db.obokucollection.find().$)),
    []
  )
  const books = useObserve(
    () => latestDatabase$.pipe(switchMap((db) => db.book.find().$)),
    []
  )
  const collectionIds = useMemo(
    () => collections?.map((doc) => doc._id),
    [collections]
  )
  const bookIds = useMemo(() => books?.map((doc) => doc._id), [books])
  const booksWithInvalidCollections = books?.filter(
    (doc) => difference(doc.collections, collectionIds ?? []).length > 0
  )
  const collectionsWithNonExistingBooks = collections?.filter(
    (doc) => difference(doc.books, bookIds ?? []).length > 0
  )
  const booksWithDanglingLinks = useBooksDanglingLinks()

  const duplicatedCollections = useMemo(() => {
    const collectionsByResourceId = groupBy(collections, "resourceId")
    const duplicatedCollections = Object.keys(collectionsByResourceId)
      .filter((resourceId) => collectionsByResourceId[resourceId]!.length > 1)
      .map((resourceId) => [
        resourceId,
        {
          name: getMetadataFromCollection(collectionsByResourceId[resourceId]![0])?.title,
          number: collectionsByResourceId[resourceId]!.length
        }
      ])

    Report.log(
      `Found ${duplicatedCollections.length} duplicated resource id`,
      duplicatedCollections
    )

    return duplicatedCollections as [string, { name: string; number: number }][]
  }, [collections])

  Report.log({
    books,
    duplicatedBookTitles,
    booksWithDanglingLinks,
    duplicatedLinks
  })

  return (
    <>
      <TopBarNavigation title={"Problems finder"} showBack={true} />
      <Box overflow="auto" flex={1}>
        <Alert severity="warning">
          PLEASE READ THIS:
          <p>
            This is an <b>EXPERIMENTAL</b> section which can help you find
            anomaly or integrity issues. However not all anomalies are due to
            system errors. For example if we detect duplicated book with same
            title, it does not necessarily means we created a duplicate by
            error. You could have created two different book with the same
            title. In this situation, if you try to resolve the problem
            automatically we might end up merging two different book whereas you
            needed to update the title of one of them.
          </p>
          <p>
            Most repairs are non destructive and will try to use or merge data
            with their latest state. For example if we fix duplicate books, we
            will make sure to prioritize the book with latest reading state.
            That being said, nothing is perfect so try to fix things by hand
            when necessary.
          </p>
          <p>
            <b>
              Before doing anything here make sure to have been connected to the
              internet and synced. In addition, make sure to to have sync your
              data source recently. Make sure to have sync all your devices if
              needed. THIS IS IMPORTANT.
            </b>
          </p>
        </Alert>
        <List>
          {duplicatedCollections.length > 0 && (
            <ListItem alignItems="flex-start">
              <ListItemText
                primary="Duplicated collection names"
                secondary={
                  <>
                    {duplicatedCollections.map(([id, { name, number }]) => (
                      <Fragment key={id}>
                        (x{number}) {name} <br />
                      </Fragment>
                    ))}
                  </>
                }
              />
            </ListItem>
          )}
          {duplicatedCollections.length > 0 && (
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => fixCollections(duplicatedCollections)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Duplicated collections from same resources"
                secondary={`
              We found ${duplicatedCollections.length} resourceId that are used by more than one collection. 
              This means that some of your collections should probably be merged together since they use the same origin.
              It is not recommended to keep duplicate resourceId since it could lead to unpredictable sync.
              `}
              />
            </ListItem>
          )}
          {!!collections && !!booksWithInvalidCollections?.length && (
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => fixBookReferences(booksWithInvalidCollections)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Books with invalid collections"
                secondary={`
                We found ${booksWithInvalidCollections.length} books with one or several reference(s) to non existing collection(s).`}
              />
            </ListItem>
          )}
          {!!books && !!collectionsWithNonExistingBooks?.length && (
            <ListItem
              alignItems="flex-start"
              button
              // onClick={() => fixBookReferences(collectionsWithNonExistingBooks)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Collections with non existing books"
                secondary={`
                We found ${collectionsWithNonExistingBooks.length} collections with one or several reference(s) to non existing book(s).
                `}
              />
            </ListItem>
          )}
          {/* {duplicatedLinks.length > 0 && (
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => fixLinksDuplicate(duplicatedLinks)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Duplicated links"
                secondary={
                  <>
                    {`We found ${duplicatedLinks.length} resource(s) that are shared by more than one link.`}
                    {duplicatedLinks.map(([resourceId, { name, number }]) => (
                      <Fragment key={resourceId}>
                        <br />
                        (x{number}) {resourceId}
                      </Fragment>
                    ))}
                  </>
                }
              />
            </ListItem>
          )} */}
          {!!booksWithDanglingLinks?.length && (
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => fixBooksDanglingLinks(booksWithDanglingLinks)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Books with reference to non existing links"
                secondary={`
                We found ${booksWithDanglingLinks.length} books with reference to non existing links.
                `}
              />
            </ListItem>
          )}
          {duplicatedBookTitles.length > 0 && (
            <ListItem
              alignItems="flex-start"
              button
              onClick={() => fixDuplicatedBookTitles(duplicatedBookTitles)}
            >
              <ListItemIcon>
                <BuildRounded />
              </ListItemIcon>
              <ListItemText
                primary="Books with same titles"
                secondary={
                  <>
                    {`We found ${duplicatedBookTitles.length} title(s) shared by more than one book.`}
                    {duplicatedBookTitles.map(([title, docs]) => (
                      <Fragment key={title}>
                        <br />
                        (x{docs.length}) {title}
                      </Fragment>
                    ))}
                  </>
                }
              />
            </ListItem>
          )}
        </List>
      </Box>
    </>
  )
})
