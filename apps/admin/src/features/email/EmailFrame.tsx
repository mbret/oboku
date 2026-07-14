/**
 * Renders raw email HTML in a sandboxed iframe so it's isolated from the admin
 * app's own styles and scripts. Used by both the compose preview and the
 * template gallery.
 */
export const EmailFrame = ({
  html,
  title = "Email preview",
  height = 480,
}: {
  html: string
  title?: string
  height?: number
}) => (
  <iframe
    title={title}
    srcDoc={html}
    sandbox=""
    style={{
      width: "100%",
      height,
      border: "1px solid var(--mantine-color-gray-3)",
      borderRadius: "var(--mantine-radius-sm)",
    }}
  />
)
