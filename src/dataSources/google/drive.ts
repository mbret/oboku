export {}
// const useGapi = () => {
//   const [signedGoogleApi, state, signIn] = useContext(GoogleAPIContext)

//   console.log('useGapi', signedGoogleApi, state)
//   useEffect(() => {
//     if (state === 'signedOut') {
//       signIn()
//     }
//   }, [state, signIn])

//   return signedGoogleApi
// }

// export const useFiles = (options: { q?: string }) => {
//   const gapi = useGapi()
//   const [cumulativeData, setCumulativeData] = useState<any[] | undefined>(undefined)
//   const [isDone, setIsDone] = useState(false)
//   const [nextToken, setNextToken] = useState(undefined)
//   const { q } = options

//   useEffect(() => {
//     setNextToken(undefined)
//     setCumulativeData(undefined)
//     setIsDone(false)
//   }, [q])

//   useEffect(() => {
//     (async () => {
//       try {
//         // setIsFetchingGoogleDriveFiles(true)
//         const response = await gapi?.client.drive.files
//           .list({
//             pageSize: 1000,
//             // fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
//             pageToken: nextToken,
//             fields: '*',
//             includeItemsFromAllDrives: false,
//             // q: `mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip' and visibility='public'`,
//             // q: `(mimeType='application/epub+zip') and sharedWithMe`,
//             q: `(mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip') and visibility = 'anyoneWithLink'`,
//             spaces: 'drive',
//             ...q && {
//               q,
//             }
//           })
//         if (response) {
//           const res = JSON.parse(response.body)
//           setCumulativeData(v => [...v || [], ...res.files])
//           console.log(res)
//           if (res.nextPageToken) {
//             setNextToken(res.nextPageToken)
//           } else {
//             setIsDone(true)
//           }
//         }
//         console.log(response)
//       } catch (e) {
//         Report.error(e)
//       }
//     })()
//   }, [gapi, q, nextToken])

//   return isDone ? cumulativeData : undefined
// }

// export const useFolders = (options: { parent: string }) => {
//   return useFiles({
//     // q: `(mimeType='application/vnd.google-apps.folder') and '0AM15DohwdqHCUk9PVA' in parents and visibility = 'anyoneWithLink'`
//     // q: `(mimeType='application/vnd.google-apps.folder') and '${options.parent}' in parents and visibility = 'anyoneWithLink'`
//     q: `(mimeType='application/vnd.google-apps.folder') and '${options.parent}' in parents`
//     // q: `(mimeType='application/vnd.google-apps.folder') and visibility = 'anyoneWithLink'`
//   })
// }
