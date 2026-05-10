let generatedDialogId = 0

export const getNextDialogId = () => {
  generatedDialogId++

  return generatedDialogId.toString()
}
