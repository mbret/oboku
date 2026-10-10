import { Box, Link, Typography } from "@mui/material"
import type { ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const components: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ node, children, ...rest }) => (
    <Typography component="h1" variant="h4" sx={{ mb: 2 }} {...(rest as any)}>
      {children}
    </Typography>
  ),
  h2: ({ node, children, ...rest }) => (
    <Typography
      component="h2"
      variant="h5"
      sx={{
        "p + &": {
          marginTop: 2,
        },
        "ul + &": {
          marginTop: 2,
        },
      }}
      {...(rest as any)}
    >
      {children}
    </Typography>
  ),
  a: ({ node, children, ...rest }) => (
    <Link {...(rest as any)}>{children}</Link>
  ),
  p: ({ node, children, ...rest }) => (
    <Typography component="p" {...(rest as any)}>
      {children}
    </Typography>
  ),
}

export const Markdown = ({ children }: { children: string }) => {
  return (
    <Box className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </Box>
  )
}
