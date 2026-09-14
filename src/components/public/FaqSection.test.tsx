import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqSection } from "./FaqSection";

describe("FaqSection", () => {
  it("exposes a Polish FAQ heading and opens an answer on request", async () => {
    const user = userEvent.setup();

    render(
      <FaqSection
        headingId="trip-faq-heading"
        items={[{ question: "Czy pytanie jest widoczne?", answer: "Tak, wraz z odpowiedzią." }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Najczęściej zadawane pytania" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Czy pytanie jest widoczne?" }));

    expect(screen.getByText("Tak, wraz z odpowiedzią.")).toBeVisible();
  });
});
