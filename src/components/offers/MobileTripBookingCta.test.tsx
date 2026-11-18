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
  it("links to camp terms in the same tab with a camp label", () => {
    render(<MobileTripBookingCta bookingUrl="#turnusy" ariaLabel="Zapisy na obóz" />);
    const link = screen.getByRole("link", { name: "Zapisz się" });
    expect(link).toHaveAttribute("href", "#turnusy");
    expect(link).not.toHaveAttribute("target");
    expect(screen.getByRole("complementary", { name: "Zapisy na obóz" })).toBeInTheDocument();
  });
  it("disables the terms action without a link", () => {
    render(<MobileTripBookingCta bookingUrl="#turnusy" disabled />);
    expect(screen.getByRole("button", { name: "Zapisz się" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Zapisz się" })).not.toBeInTheDocument();
  });
  it.each([
    "#other",
    "#turnusy-extra",
    "",
    "invalid",
    "http://example.test",
    "javascript:alert(1)",
  ])("renders neither action nor reserved space for %s", (bookingUrl) => {
    const { container } = render(<MobileTripBookingCta bookingUrl={bookingUrl} />);
    expect(container).toBeEmptyDOMElement();
  });
});
