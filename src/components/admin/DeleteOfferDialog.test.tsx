import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeleteOfferDialog } from "./DeleteOfferDialog";

afterEach(cleanup);

describe("DeleteOfferDialog", () => {
  it("does not archive when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteOfferDialog offerTitle="Wyjazd testowy" isArchiving={false} onConfirm={onConfirm} />,
    );
    await user.click(screen.getByRole("button", { name: "Archiwizuj ofertę" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Wyjazd testowy");

    await user.click(screen.getByRole("button", { name: "Anuluj" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("archives once and disables the confirmation while archiving", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const props = { offerTitle: "Wyjazd testowy", onConfirm };
    const { rerender } = render(<DeleteOfferDialog {...props} isArchiving={false} />);

    await user.click(screen.getByRole("button", { name: "Archiwizuj ofertę" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Archiwizuj" }),
    );

    expect(onConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Archiwizuj ofertę" }));
    rerender(<DeleteOfferDialog {...props} isArchiving />);

    const confirmButton = within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Archiwizuj",
    });
    expect(confirmButton).toBeDisabled();

    await user.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
