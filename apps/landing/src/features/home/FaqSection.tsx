import { Box, Container, Link, Stack, Typography } from "@mui/material"
import { links } from "@oboku/shared"
import type { ReactNode } from "react"
import { BandSection } from "../common/BandSection"
import { SectionHeading } from "../common/SectionHeading"

const questions: { question: string; answer: ReactNode }[] = [
  {
    question: "Is oboku free?",
    answer:
      "Yes, and we intend to keep it that way: no ads, no paywall, and open-source code under the GPL-3.0 license. Donations and sponsorship will be available to help sustain the project, and the cloud version will stay online for as long as we can cover its infrastructure costs.",
  },
  {
    question: "Which formats can I read?",
    answer:
      "EPUB ebooks, comics and manga in CBZ or CBR, PDF documents, plain text, and ZIP or RAR archives of images or audio.",
  },
  {
    question: "Where are my books stored?",
    answer:
      "Where they already are: oboku's servers sync your library, collections and reading progress, never the book files. Books you add from your device stay on that device, so they can only be read there.",
  },
  {
    question: "Can I read offline?",
    answer:
      "Yes, every book you have downloaded. oboku itself starts without a connection after your first visit, and what you change offline syncs to your other devices once you are back online.",
  },
  {
    question: "Which devices does oboku work on?",
    answer:
      "Anything with a modern web browser: phones, tablets, computers and e-ink tablets. Devices without a usable browser, such as Kobo e-readers or the reMarkable, can't run it.",
  },
  {
    question: "Does oboku work with KOReader?",
    answer: (
      <>
        Yes. Oboku can be the sync server of KOReader, Readest, CrossPoint and
        the other apps that support KOReader sync: point them at oboku and they
        keep the same reading position wherever you read with them. Turn it on
        from your profile and follow the{" "}
        <Link href={links.documentationKoreaderSyncServer} target="_blank">
          setup guide
        </Link>
        . These apps sync with each other, not with the oboku reader itself.
      </>
    ),
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

export function FaqSection() {
  return (
    <BandSection aria-labelledby="faq-title">
      <Container>
        <SectionHeading
          overline="FAQ"
          title="Frequently asked questions"
          titleId="faq-title"
        />
        <Box
          sx={{
            mt: 6,
            display: "grid",
            gridTemplateColumns: ["1fr", "1fr 1fr"],
            gap: 4,
          }}
        >
          {questions.map(function renderQuestion({ question, answer }) {
            return (
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
            )
          })}
        </Box>
      </Container>
    </BandSection>
  )
}
