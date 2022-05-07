import { useMemo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { Typography, useTheme } from "@material-ui/core"
import { useNavigate, useParams } from "react-router-dom"
import EmptyLibraryAsset from "../assets/empty-library.svg"
import CollectionBgSvg from "../assets/series-bg.svg"
import { useRecoilValue } from "recoil"
import { collectionState } from "./states"
import { useCollectionActionsDrawer } from "./CollectionActionsDrawer"
import { BookListWithControls } from "../books/bookList/BookListWithControls"

type ScreenParams = {
  id: string
}

export const CollectionDetailsScreen = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { id = `-1` } = useParams<ScreenParams>()
  const collection = useRecoilValue(collectionState(id || "-1"))
  const data =
    useMemo(
      () => collection?.books?.map((book) => book || "-1"),
      [collection?.books]
    ) || []
  const { open: openActionDrawer } = useCollectionActionsDrawer(
    id,
    (changes) => {
      if (changes === `delete`) {
        navigate(-1)
      }
    }
  )

  const titleTypoStyle = {
    color: "white",
    textShadow: "0px 0px 3px black"
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          height: "100%"
        }}
      >
        <TopBarNavigation
          title=""
          showBack={true}
          position="absolute"
          color="transparent"
          onMoreClick={openActionDrawer}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            flex: 1
          }}
        >
          <div
            style={{
              paddingTop: theme.spacing(1) + 50,
              display: "flex",
              alignItems: "flex-end",
              paddingLeft: theme.spacing(2),
              paddingRight: theme.spacing(2),
              width: "100%",
              backgroundImage: `url(${CollectionBgSvg})`,
              backgroundAttachment: "fixed",
              backgroundSize: "cover"
            }}
          >
            <div>
              <Typography variant="h5" style={titleTypoStyle}>
                {collection?.displayableName}
              </Typography>
              <Typography
                variant="subtitle1"
                gutterBottom
                style={titleTypoStyle}
              >
                {`${collection?.books?.length || 0} book(s)`}
              </Typography>
            </div>
          </div>
          <BookListWithControls
            data={data}
            defaultSort="alpha"
            renderEmptyList={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flex: 1,
                    justifyContent: "center",
                    flexFlow: "column",
                    alignItems: "center",
                    textAlign: "center",
                    width: "80%",
                    maxWidth: theme.custom.maxWidthCenteredContent
                  }}
                >
                  <img
                    style={{
                      width: "100%"
                    }}
                    src={EmptyLibraryAsset}
                    alt="libray"
                  />
                  <Typography
                    style={{ maxWidth: 300, paddingTop: theme.spacing(1) }}
                  >
                    It looks like your library is empty for the moment. Maybe
                    it's time to add a new book
                  </Typography>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}
