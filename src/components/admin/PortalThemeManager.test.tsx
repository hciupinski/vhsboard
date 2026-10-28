import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { read, save } = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/portal-theme/repository", () => ({
  getAdminPortalTheme: read,
  savePortalTheme: save,
}));
import { PortalThemeManager } from "./PortalThemeManager";

const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <PortalThemeManager />
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  read.mockResolvedValue("original");
  save.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.resetAllMocks();
});

describe("CMS global portal theme", () => {
  it("loads the saved choice without publishing a new selection before explicit save", async () => {
    setup();
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Obecny/ })).toBeChecked());
    await userEvent.click(screen.getByRole("radio", { name: /^Zimowy/ }));
    expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeChecked();
    expect(save).not.toHaveBeenCalled();
  });

  it("announces success and updates the public cache only after a confirmed save", async () => {
    const client = setup();
    client.setQueryData(["public", "portal-theme"], "original");
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeEnabled());
    await userEvent.click(screen.getByRole("radio", { name: /^Zimowy/ }));
    await userEvent.click(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" }));
    expect(await screen.findByRole("status")).toHaveTextContent("zapisany");
    expect(save).toHaveBeenCalledWith("winter");
    expect(client.getQueryData(["public", "portal-theme"])).toBe("winter");
  });

  it("preserves a failed draft and allows retry without announcing success", async () => {
    save.mockRejectedValueOnce(new Error("forbidden"));
    setup();
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeEnabled());
    await userEvent.click(screen.getByRole("radio", { name: /^Zimowy/ }));
    await userEvent.click(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się zapisać");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" }));
    expect(await screen.findByRole("status")).toHaveTextContent("zapisany");
  });

  it("blocks saving after a failed load and offers a retry", async () => {
    read.mockRejectedValueOnce(new Error("offline"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się pobrać");
    expect(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prevents duplicate saves while the mutation is pending", async () => {
    save.mockReturnValue(new Promise(() => undefined));
    setup();
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeEnabled());
    await userEvent.click(screen.getByRole("radio", { name: /^Zimowy/ }));
    await userEvent.click(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" }));
    expect(screen.getByRole("radio", { name: /^Obecny/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Zapisywanie/ })).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("can restore the original theme", async () => {
    read.mockResolvedValue("winter");
    setup();
    await waitFor(() => expect(screen.getByRole("radio", { name: /^Zimowy/ })).toBeChecked());
    await userEvent.click(screen.getByRole("radio", { name: /^Obecny/ }));
    await userEvent.click(screen.getByRole("button", { name: "Zapisz i zastosuj globalnie" }));
    expect(await screen.findByRole("status")).toHaveTextContent("zapisany");
    expect(save).toHaveBeenCalledWith("original");
  });
});
