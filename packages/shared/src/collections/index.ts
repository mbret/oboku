export const getCollectionCoverKey = (
  userNameHex: string,
  collectionId: string,
) => {
  return `collection-${userNameHex}-${collectionId}`
}
