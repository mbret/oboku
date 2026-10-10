import { Box, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import type { ReactNode } from "react"

const questions: { question: string; answer: ReactNode }[] = [
  {
    question: "Is oboku free?",
    answer:
      "Yes. Oboku is free, ad-free and open source under the GPL-3.0 license. Use the cloud version at no cost, or host it yourself.",
  },
  {
    question: "Which formats can I read?",
    answer:
      "EPUB ebooks, comics and manga in CBZ or CBR, PDF documents, plain text, and ZIP or RAR archives of images or audio. The reader is built on Prose, an engine designed to open any kind of content.",
  },
  {
    question: "Where are my books stored?",
    answer:
      "Where they already are. Oboku links your books from Google Drive, Dropbox, OneDrive, Synology, a WebDAV server or your device, and downloads them from there when you open them. Your book files are never stored on oboku's servers: only your library, collections and reading progress are synced between your devices.",
  },
  {
    question: "Can I read offline?",
    answer:
      "Yes. Oboku is offline-first: download a book once and read it without a connection. Anything you change offline syncs when you are back online.",
  },
  {
    question: "Which devices does oboku work on?",
    answer:
      "Anything with a modern web browser: phones, tablets, computers and e-ink devices. Oboku is a progressive web app, so you can install it to your home screen and use it like a native app. E-ink mode raises contrast and removes animations.",
  },
  {
    question: "Can I self-host oboku?",
    answer: (
      <>
        Yes. Oboku ships as Docker images you can run with Docker Compose, and a
        self-hosted instance can also synchronize books stored on the server
        itself. Follow the{" "}
        <Link href={links.documentationSelfHosting} target="_blank">
          self-hosting guide
        </Link>
        .
      </>
    ),
  },
  {
    question: "How is oboku different from Calibre-Web, Kavita or Komga?",
    answer:
      "Those are servers you run yourself, reading books stored on their own disk. Oboku does not need a server of your own: it reads your books from the storage you already use and keeps working offline. If you prefer to run everything yourself, you can still self-host it.",
  },
]

export const FaqSection = () => {
  return (
    <Container>
      <Stack
        sx={{
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h2">
          Frequently asked questions
        </Typography>
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: ["1fr", "1fr 1fr"],
            gap: 4,
          }}
        >
          {questions.map(({ question, answer }) => (
            <Stack
              key={question}
              sx={{
                gap: 1,
              }}
            >
              <Typography variant="h6" component="h3">
                {question}
              </Typography>
              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                {answer}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Container>
  )
}
