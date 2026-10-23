import { plugins } from "./configure"

export const signOutPlugins = () => {
  plugins.forEach(function signOutPlugin(plugin) {
    plugin.signOut?.()
  })
}
