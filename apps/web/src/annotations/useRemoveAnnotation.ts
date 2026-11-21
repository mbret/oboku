import { useAnnotationsWrite } from "./useAnnotationsWrite"

export const useRemoveAnnotation = ({ bookId }: { bookId: string }) =>
  useAnnotationsWrite({
    bookId,
    write: function removeAnnotation(database, id: string) {
      return database.annotation.findOne(id).incrementalRemove()
    },
    changeList: function takeAnnotationOut(annotations, id) {
      return annotations.filter((annotation) => annotation.id !== id)
    },
  })
