import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MobileTripBookingCta } from "./MobileTripBookingCta";

afterEach(cleanup);
describe("MobileTripBookingCta", () => {
  it("hands off to the current HTTPS booking URL and updates when the trip changes", () => {
    const { rerender } = render(
      <MobileTripBookingCta bookingUrl="https://tripahead.example/surf" />,
    );
    const link = screen.getByRole("link", { name: "Zapisz się" });
    expect(link).toHaveAttribute("href", "https://tripahead.example/surf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    rerender(<MobileTripBookingCta bookingUrl="https://tripahead.example/snow" />);
    expect(screen.getByRole("link", { name: "Zapisz się" })).toHaveAttribute(
      "href",
      "https://tripahead.example/snow",
    );
  });
  it.each(["", "invalid", "http://example.test", "javascript:alert(1)"])(
    "renders neither action nor reserved space for %s",
    (bookingUrl) => {
      const { container } = render(<MobileTripBookingCta bookingUrl={bookingUrl} />);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
