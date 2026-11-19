/**
 * Makes the browser's install offer, as Chromium does around page load.
 * `answerInstallDialog` settles what the user chose in the install dialog.
 */
export const offerInstallPrompt = () => {
  const dialogAnswer = Promise.withResolvers<BeforeInstallPromptUserChoice>()
  const installPrompt = Object.assign(new Event("beforeinstallprompt"), {
    platforms: ["web"],
    userChoice: dialogAnswer.promise,
    prompt: () => dialogAnswer.promise,
  })

  window.dispatchEvent(installPrompt)

  return { installPrompt, answerInstallDialog: dialogAnswer.resolve }
}

export const reportAppInstalled = () => {
  window.dispatchEvent(new Event("appinstalled"))
}
