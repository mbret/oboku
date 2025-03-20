import {
  CloudRounded,
  FolderRounded,
  LocalOfferRounded,
  MenuBookRounded,
} from "@mui/icons-material"

export const getRxModelLabelFromValue = (
  rxModel: "obokucollection" | "book" | "tag" | "link" | "datasource",
) => {
  switch (rxModel) {
    case "obokucollection":
      return "collection"
    case "tag":
      return "tag"
    case "datasource":
      return "datasource"
    case "link":
      return "link"
    default:
      return "book"
  }
}

export const getRxModelIconFromValue = (
  rxModel: "obokucollection" | "book" | "tag" | "link" | "datasource",
) => {
  switch (rxModel) {
    case "obokucollection":
      return FolderRounded
    case "tag":
      return LocalOfferRounded
    case "datasource":
      return CloudRounded
    case "link":
      return LocalOfferRounded
    default:
      return MenuBookRounded
  }
}
