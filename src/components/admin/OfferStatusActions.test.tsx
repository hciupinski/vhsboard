import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OfferStatusActions } from "./OfferStatusActions";

afterEach(cleanup);

describe("OfferStatusActions", () => {
  it("keeps publishing disabled until the form is publishable and calls it once", async () => {
    const user = userEvent.setup();
    const onPublish = vi.fn().mockResolvedValue(undefined);
    const props = {
      status: "draft" as const,
      isSubmitting: false,
      onSaveDraft: vi.fn(),
      onPublish,
      onUnpublish: vi.fn(),
    };
    const { rerender } = render(<OfferStatusActions {...props} canPublish={false} />);

    expect(screen.getByRole("button", { name: "Opublikuj" })).toBeDisabled();

    rerender(<OfferStatusActions {...props} canPublish />);
    await user.click(screen.getByRole("button", { name: "Opublikuj" }));

    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("shows the action that matches the current offer status", () => {
    const callbacks = {
      isSubmitting: false,
      canPublish: true,
      onSaveDraft: vi.fn(),
      onPublish: vi.fn(),
      onUnpublish: vi.fn(),
    };
    const { rerender } = render(<OfferStatusActions {...callbacks} status="draft" />);

    expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opublikuj" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cofnij publikację" })).not.toBeInTheDocument();

    rerender(<OfferStatusActions {...callbacks} status="published" />);

    expect(screen.getByRole("button", { name: "Zapisz" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zapisz szkic" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Opublikuj" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cofnij publikację" })).toBeInTheDocument();

    rerender(<OfferStatusActions {...callbacks} status="archived" />);

    expect(screen.queryByRole("button", { name: "Zapisz szkic" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Opublikuj" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cofnij publikację" })).not.toBeInTheDocument();
  });

  it("blocks a second status action while its callback remains pending", async () => {
    const user = userEvent.setup();
    let resolveSaveDraft: (() => void) | undefined;
    const onSaveDraft = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSaveDraft = resolve;
        }),
    );
    const props = {
      status: "draft" as const,
      canPublish: true,
      onSaveDraft,
      onPublish: vi.fn(),
      onUnpublish: vi.fn(),
    };
    render(<OfferStatusActions {...props} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));
    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));

    expect(onSaveDraft).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeDisabled();

    resolveSaveDraft?.();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Zapisz szkic" })).not.toBeDisabled();
    });
  });

  it("respects an externally pending status submission", async () => {
    const user = userEvent.setup();
    const onSaveDraft = vi.fn();

    render(
      <OfferStatusActions
        status="draft"
        isSubmitting
        canPublish
        onSaveDraft={onSaveDraft}
        onPublish={vi.fn()}
        onUnpublish={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Zapisz szkic" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Opublikuj" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Zapisz szkic" }));
    expect(onSaveDraft).not.toHaveBeenCalled();
  });
});
