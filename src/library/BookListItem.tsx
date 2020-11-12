import React, { useRef } from 'react'
// import { CircularProgress, GridList, GridListTile, GridListTileBar, IconButton, ListSubheader, makeStyles } from "@material-ui/core"
// import { useQuery } from '@apollo/client';
// import { Info, CloudDownloadRounded } from '@material-ui/icons';
// import { BOOK } from '../queries';
// import { models } from '../client';
// import { useWindowSize } from 'react-use';
// import { API_URI } from '../constants';
// import localforage from 'localforage';

// export const BookListItem = ({ id }) => {
//   const classes = useStyles();
//   const { data } = useQuery(BOOK, { variables: { id } });
//   const book = data?.book
//   const windowSize = useWindowSize()
//   const downloadFile = useDownloadFile()

//   console.log('BookListItem', id, data)

//   return (
//     <>
//       <img
//         alt="img"
//         src={`${API_URI}/cover/${book.id}`}
//         style={{
//           opacity: 0.5,
//           ...!book.lastMetadataUpdatedAt && {
//             // opacity: 0.5
//           }
//         }} />
//       <div style={{
//         position: 'absolute',
//         height: '100%',
//         width: '100%',
//         top: 0,
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center'
//       }}>
//         {!book.lastMetadataUpdatedAt && (
//           <CircularProgress />
//         )}
//       </div>
//       <GridListTileBar
//         title={<CloudDownloadRounded />}
//         titlePosition="top"
//         actionPosition="left"
//       />
//       <GridListTileBar
//         title={book.lastMetadataUpdatedAt ? book.title : ''}
//         subtitle={
//           <span>{book.lastMetadataUpdatedAt ? `by: ${book.creator}` : 'Fetching metadata...'}</span>
//         }
//         actionIcon={
//           <IconButton
//             aria-label={`info about ${book.title}`}
//             className={classes.icon}
//             onClick={() => {
//               models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(book.id))
//             }}
//           >
//             <Info />
//           </IconButton>
//         }
//       />
//     </>
//   )
// }

// BookListItem.displayName = 'BookListItem'

// const useStyles = () => {
//   const windowSize = useWindowSize()

//   return useRef(makeStyles((theme) => ({
//     root: {
//       display: 'flex',
//       flexWrap: 'wrap',
//       justifyContent: 'space-around',
//       overflow: 'hidden',
//       backgroundColor: theme.palette.background.paper,
//     },
//     gridList: {
//       width: (props: any) => props.windowSize.width,
//       // height: 300,
//       // borderWidth: 1,
//       // borderColor: 'black'
//     },
//     icon: {
//       color: 'rgba(255, 255, 255, 0.54)',
//     },
//   }))).current({
//     windowSize
//   })
// }

// const useDownloadFile = () => {

//   return async (bookId: number) => {
//     const response = await fetch(`http://localhost:4000/download/${bookId}`)
//     await localforage.setItem(`book-download-${bookId}`, await response.arrayBuffer())
//     console.log('Book downloaded')
//   }
// }