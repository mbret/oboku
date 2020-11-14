
/**
 * 
 * @see https://developers.google.com/drive/api/v3/search-files
 */
export const listFiles = (googleAuth, searchTerm) => {
  // setIsFetchingGoogleDriveFiles(true);
  googleAuth.client.drive.files
    .list({
      pageSize: 50,
      // fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      fields: '*',
      includeItemsFromAllDrives: false,
      // q: `mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip' and visibility='public'`,
      // q: `(mimeType='application/epub+zip') and sharedWithMe`,
      q: `(mimeType='application/vnd.google-apps.folder' or mimeType='application/epub+zip') and visibility = 'anyoneWithLink'`,
      spaces: 'drive',
    })
    .then(function (response) {
      // setIsFetchingGoogleDriveFiles(false);
      // setListDocumentsVisibility(true);
      const res = JSON.parse(response.body);
      // setDocuments(res.files);
      console.log(res)
    }).catch(console.error)
};