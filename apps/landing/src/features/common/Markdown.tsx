import { Box, Link, Typography } from "@mui/material"
import type { ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const components: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: function MarkdownHeading1({ node, children, ...rest }) {
    return (
      <Typography component="h1" variant="h4" sx={{ mb: 2 }} {...rest}>
        {children}
      </Typography>
    )
  },
  h2: function MarkdownHeading2({ node, children, ...rest }) {
    return (
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
        {...rest}
      >
        {children}
      </Typography>
    )
  },
  a: function MarkdownLink({ node, children, ...rest }) {
    return <Link {...rest}>{children}</Link>
  },
  p: function MarkdownParagraph({ node, children, ...rest }) {
    return (
      <Typography component="p" {...rest}>
        {children}
      </Typography>
    )
  },
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
