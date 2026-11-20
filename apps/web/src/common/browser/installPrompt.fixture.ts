export const offerInstallPrompt = () => {
  const dialogAnswer = Promise.withResolvers<BeforeInstallPromptUserChoice>()
  const installPrompt: BeforeInstallPromptEvent = Object.assign(
    new Event("beforeinstallprompt"),
    {
      platforms: ["web"],
      userChoice: dialogAnswer.promise,
      prompt: () => dialogAnswer.promise,
    },
  )

  window.dispatchEvent(installPrompt)

  return { installPrompt, answerInstallDialog: dialogAnswer.resolve }
}

export const reportAppInstalled = () => {
  window.dispatchEvent(new Event("appinstalled"))
}
