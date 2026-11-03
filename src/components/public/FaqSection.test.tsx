import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { FaqSection } from "./FaqSection";
import { tripFaqItems } from "@/lib/faq";

afterEach(cleanup);

describe("FaqSection", () => {
  it("links the freestyle video in the client's training answer", async () => {
    const user = userEvent.setup();
    render(<FaqSection headingId="trip-faq" items={tripFaqItems} />);
    await user.click(
      screen.getByRole("button", { name: "Jak wyglądają szkolenia podczas wyjazdów?" }),
    );
    expect(screen.getByRole("link", { name: "freestylu" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=k4DNSx4JNlU",
    );
  });
  it("exposes a Polish FAQ heading and opens an answer on request", async () => {
    const user = userEvent.setup();

    render(
      <FaqSection
        headingId="trip-faq-heading"
        items={[{ question: "Czy pytanie jest widoczne?", answer: "Tak, wraz z odpowiedzią." }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Najczęściej zadawane pytania" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Czy pytanie jest widoczne?" }));

    expect(screen.getByText("Tak, wraz z odpowiedzią.")).toBeVisible();
  });

  it("renders paragraphs separately when an answer contains a blank line", async () => {
    const user = userEvent.setup();

    render(
      <FaqSection
        headingId="about-faq-heading"
        items={[
          {
            question: "Jak wygląda odpowiedź?",
            answer: "Pierwszy akapit.\n\nDrugi akapit.",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Jak wygląda odpowiedź?" }));

    expect(screen.getByText("Pierwszy akapit.").tagName).toBe("P");
    expect(screen.getByText("Drugi akapit.").tagName).toBe("P");
  });
});
