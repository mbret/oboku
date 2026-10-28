import type {
  OpdsServerDto,
  OpdsServerPasswordResponseDto,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DialogProvider } from "../../common/dialogs/DialogProvider"
import { dialogSignal } from "../../common/dialogs/state"
import { HttpClientApiContext } from "../../http"
import type { HttpApiClientWeb } from "../../http/HttpClientApi.web"
import {
  clearActiveProfileId,
  setActiveProfileId,
} from "../../profiles/active/activeProfileId"
import { OpdsServersScreen } from "./OpdsServersScreen"

vi.mock("../../auth/useIsAuthenticated", function mockIsAuthenticated() {
  return { useIsAuthenticated: () => true }
})

vi.mock("../../config/useConfig", function mockConfig() {
  return {
    useConfig: () => ({
      data: { API_OPDS_URL: "https://api.oboku.test/opds" },
    }),
  }
})

const COMICS: OpdsServerDto = {
  id: 1,
  slug: "calm-snails-dream",
  name: "Comics",
  username: "reader@example.com",
  createdAt: "2026-01-01T00:00:00.000Z",
}

const NOVELS: OpdsServerDto = {
  id: 2,
  slug: "brave-foxes-run",
  name: "Novels",
  username: "reader@example.com",
  createdAt: "2026-02-01T00:00:00.000Z",
}

const withPassword = (
  server: OpdsServerDto,
  password: string,
): { data: OpdsServerPasswordResponseDto } => ({
  data: { server, password },
})

const renderScreen = (serverLists: OpdsServerDto[][]) => {
  const listServers = vi.fn().mockResolvedValue({ data: serverLists.at(-1) })

  for (const servers of serverLists.slice(0, -1)) {
    listServers.mockResolvedValueOnce({ data: servers })
  }

  const api = {
    get: listServers,
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn().mockResolvedValue({ data: { ok: true } }),
  }
  // test double: the screen only calls the generated client's HTTP methods
  const client = { sdkClient: api } as unknown as HttpApiClientWeb
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  })

  setActiveProfileId("profile")
  render(
    <QueryClientProvider client={queryClient}>
      <HttpClientApiContext.Provider value={client}>
        <MemoryRouter>
          <DialogProvider>
            <OpdsServersScreen />
          </DialogProvider>
        </MemoryRouter>
      </HttpClientApiContext.Provider>
    </QueryClientProvider>,
  )

  return api
}

const findServerSection = async (name: string) => {
  const title = await screen.findByText(name)
  const section = title.nextElementSibling

  if (!(section instanceof HTMLElement)) {
    throw new Error(`No section follows the title ${name}`)
  }

  return within(section)
}

const fieldValues = (name: string) =>
  screen
    .getAllByRole<HTMLInputElement>("textbox", { name })
    .map((field) => field.value)

describe("OpdsServersScreen", () => {
  afterEach(() => {
    cleanup()
    dialogSignal.setValue([])
    clearActiveProfileId()
  })

  it("lists the newest server first, with the catalog URL and username a reading app signs in with", async () => {
    renderScreen([[COMICS, NOVELS]])

    await screen.findByText("Novels")

    expect(fieldValues("Catalog URL")).toEqual([
      "https://api.oboku.test/opds/brave-foxes-run",
      "https://api.oboku.test/opds/calm-snails-dream",
    ])
    expect(fieldValues("Username")).toEqual([
      "reader@example.com",
      "reader@example.com",
    ])
    expect(screen.queryByRole("textbox", { name: "Password" })).toBeNull()
  })

  it("shows the password of the server it creates", async () => {
    const api = renderScreen([[COMICS], [COMICS, NOVELS]])
    api.post.mockResolvedValue(withPassword(NOVELS, "k7mq-x2fp-9dwa-hc4n"))

    fireEvent.click(
      await screen.findByRole("button", { name: "Create a server" }),
    )

    const novels = await findServerSection("Novels")

    expect(
      novels.getByRole<HTMLInputElement>("textbox", { name: "Password" }).value,
    ).toBe("k7mq-x2fp-9dwa-hc4n")
    expect(api.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/opds-servers" }),
    )
  })

  it("shows only the latest password it generated", async () => {
    const api = renderScreen([[COMICS], [COMICS, NOVELS]])
    api.post
      .mockResolvedValueOnce(withPassword(NOVELS, "k7mq-x2fp-9dwa-hc4n"))
      .mockResolvedValueOnce(withPassword(COMICS, "p3rt-h8vb-2kca-wq6e"))

    fireEvent.click(
      await screen.findByRole("button", { name: "Create a server" }),
    )
    await (await findServerSection("Novels")).findByRole("textbox", {
      name: "Password",
    })
    const comics = await findServerSection("Comics")
    fireEvent.click(
      comics.getByRole("button", { name: "Generate a new password" }),
    )
    fireEvent.click(await screen.findByRole("button", { name: "Generate" }))

    await waitFor(() => {
      expect(fieldValues("Password")).toEqual(["p3rt-h8vb-2kca-wq6e"])
    })
    expect(api.post).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "/opds-servers/{id}/password",
        path: { id: COMICS.id },
      }),
    )
  })

  it("renames a server to a name that is not blank", async () => {
    const api = renderScreen([[COMICS], [{ ...COMICS, name: "Bedtime" }]])
    api.patch.mockResolvedValue({ data: { ...COMICS, name: "Bedtime" } })

    const comics = await findServerSection("Comics")
    fireEvent.click(comics.getByRole("button", { name: "Rename" }))
    const dialog = within(await screen.findByRole("dialog"))
    const nameField = dialog.getByRole("textbox", { name: "Name" })

    fireEvent.change(nameField, { target: { value: "   " } })
    expect(
      dialog.getByRole<HTMLButtonElement>("button", { name: "Save" }).disabled,
    ).toBe(true)

    fireEvent.change(nameField, { target: { value: "Bedtime" } })
    fireEvent.click(dialog.getByRole("button", { name: "Save" }))

    expect(await screen.findByText("Bedtime")).not.toBeNull()
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
    expect(api.patch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/opds-servers/{id}",
        path: { id: COMICS.id },
        body: { name: "Bedtime" },
      }),
    )
  })

  it("deletes a server only once its deletion is confirmed", async () => {
    const api = renderScreen([[COMICS], []])

    const comics = await findServerSection("Comics")
    fireEvent.click(comics.getByRole("button", { name: "Delete" }))
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })

    expect(api.delete).not.toHaveBeenCalled()

    fireEvent.click(comics.getByRole("button", { name: "Delete" }))
    const dialog = within(await screen.findByRole("dialog"))
    fireEvent.click(dialog.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(screen.queryByText("Comics")).toBeNull()
    })
    expect(api.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/opds-servers/{id}",
        path: { id: COMICS.id },
      }),
    )
  })
})
