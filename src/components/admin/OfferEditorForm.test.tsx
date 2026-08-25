import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EditableOfferInput } from "@/lib/offers/editor-schema";

import { OfferEditorForm } from "./OfferEditorForm";

const completeInput: EditableOfferInput = {
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: {
    paragraphs: ["Tekst o wyjeździe."],
    highlights: ["Dwie sesje dziennie"],
    included: ["Nocleg"],
    excluded: ["Lot"],
    schedule: [{ day: "Dzień 1", text: "Przyjazd." }],
  },
  location: "Ericeira, Portugalia",
  startDate: "2026-06-12",
  endDate: "2026-06-18",
  durationDays: 7,
  groupSizeMin: 12,
  groupSizeMax: 18,
  priceFrom: 3100,
  currency: "PLN",
  bookingUrl: "https://zapisy.example/atlantic-surf-week",
  heroImagePath: "offers/atlantic-surf-week/hero.jpg",
};

const dayCampInput: EditableOfferInput = {
  ...completeInput,
  offerKind: "day_camp",
  activity: "wake",
  content: {
    paragraphs: ["Pięć dni na wodzie."],
    highlights: ["Małe grupy"],
    included: ["Opieka instruktora"],
    excluded: ["Dojazd"],
    venueDescription: "Wakepark z wydzieloną strefą dla początkujących.",
    dayProgram: [{ time: "09:00", text: "Rozgrzewka." }],
    parentInfo: {
      ageRange: "8–14 lat",
      supervision: "Opieka przez cały dzień.",
      safety: "Kamizelki i kaski są obowiązkowe.",
      transport: "Dojazd własny.",
    },
    terms: [
      {
        label: "Turnus lipcowy",
        startDate: "2026-07-06",
        endDate: "2026-07-10",
        bookingUrl: "https://zapisy.example/wake-lipiec",
        priceOptions: [
          {
            label: "Cena standardowa",
            price: 1290,
          },
        ],
      },
    ],
  },
};

afterEach(cleanup);

describe("OfferEditorForm", () => {
  it("keeps entered data and exposes a Polish field error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <OfferEditorForm
        value={completeInput}
        errors={{ bookingUrl: "Adres rezerwacji musi używać HTTPS." }}
        disabled={false}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Adres rezerwacji musi używać HTTPS.");
    await user.clear(screen.getByLabelText("Tytuł wyjazdu"));
    await user.type(screen.getByLabelText("Tytuł wyjazdu"), "Nowy tytuł");

    expect(onChange).toHaveBeenCalled();
  });

  it("preserves the five editor sections", () => {
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    for (const name of ["Podstawy", "O wyjeździe", "W cenie i poza", "Dzień po dniu", "Zdjęcia"]) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("adds an empty description item without mutating the current value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
    await user.click(screen.getAllByRole("button", { name: "Dodaj pozycję" })[0]);

    expect(onChange).toHaveBeenCalledWith({
      ...completeInput,
      content: {
        ...completeInput.content,
        paragraphs: ["Tekst o wyjeździe.", ""],
      },
    });
    expect(completeInput.content.paragraphs).toEqual(["Tekst o wyjeździe."]);
  });

  it("labels repeated list controls in Polish", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));

    expect(screen.getByLabelText("Akapity opisu 1")).toHaveValue("Tekst o wyjeździe.");
    expect(screen.getByLabelText("Najlepsze momenty 1")).toHaveValue("Dwie sesje dziennie");
  });

  it("updates only the selected schedule row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = {
      ...completeInput,
      content: {
        ...completeInput.content,
        schedule: [
          { day: "Dzień 1", text: "Przyjazd." },
          { day: "Dzień 2", text: "Pierwsza sesja." },
        ],
      },
    };
    render(<OfferEditorForm value={value} errors={{}} disabled={false} onChange={onChange} />);

    await user.click(screen.getByRole("tab", { name: "Dzień po dniu" }));
    fireEvent.change(screen.getByLabelText("Dzień 2 — opis"), {
      target: { value: "Dwie sesje i analiza nagrań." },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...value,
      content: {
        ...value.content,
        schedule: [
          { day: "Dzień 1", text: "Przyjazd." },
          { day: "Dzień 2", text: "Dwie sesje i analiza nagrań." },
        ],
      },
    });
    expect(value.content.schedule[1].text).toBe("Pierwsza sesja.");
  });

  it("adds a numbered part rather than a pre-grouped day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole("tab", { name: "Dzień po dniu" }));
    await user.click(screen.getByRole("button", { name: "Dodaj dzień" }));

    expect(onChange).toHaveBeenCalledWith({
      ...completeInput,
      content: {
        ...completeInput.content,
        schedule: [
          { day: "Dzień 1", text: "Przyjazd." },
          { day: "Część 2", text: "" },
        ],
      },
    });
  });

  it("disables native editing controls in every content section", async () => {
    const user = userEvent.setup();
    render(<OfferEditorForm value={completeInput} errors={{}} disabled onChange={vi.fn()} />);

    expect(screen.getByLabelText("Tytuł wyjazdu")).toBeDisabled();
    expect(screen.getByLabelText("Adres zapisów")).toBeDisabled();
    expect(screen.getByLabelText("Rodzaj wyjazdu")).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
    expect(screen.getAllByRole("button", { name: "Dodaj pozycję" })[0]).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "Dzień po dniu" }));
    expect(screen.getByRole("button", { name: "Dodaj dzień" })).toBeDisabled();
  });

  it("shows image readiness without exposing an image URL or path input", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("tab", { name: "Zdjęcia" }));

    expect(screen.getByText("Najpierw zapisz szkic, aby dodać zdjęcia.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders the supplied saved-offer image manager in the photos tab", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm
        value={completeInput}
        errors={{}}
        disabled={false}
        onChange={vi.fn()}
        imageManager={<p>Panel zarządzania zdjęciami</p>}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Zdjęcia" }));

    expect(screen.getByText("Panel zarządzania zdjęciami")).toBeInTheDocument();
    expect(screen.queryByText("Najpierw zapisz szkic, aby dodać zdjęcia.")).not.toBeInTheDocument();
  });

  it("edits terms, price variants and the day-camp programme", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={dayCampInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    expect(screen.getByText("Turnusy i warianty cen")).toBeInTheDocument();
    expect(screen.getByLabelText("Turnus 1, wariant 1 — cena")).toHaveValue(1290);
    expect(screen.getByLabelText("Turnus 1 — adres zapisów")).toHaveValue(
      "https://zapisy.example/wake-lipiec",
    );
    expect(screen.queryByText("Plan zajęć")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Program i opieka" }));
    expect(screen.getByLabelText("Plan dnia 1 — godzina")).toHaveValue("09:00");
    expect(screen.getByText("5/120 znaków")).toBeInTheDocument();
    expect(screen.getByLabelText("Transport")).toHaveValue("Dojazd własny.");
  });

  it("shows character limits next to limited text fields", () => {
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    expect(screen.getByText(`${completeInput.title.length}/120 znaków`)).toBeInTheDocument();
    expect(
      screen.getByText(`${completeInput.shortDescription.length}/500 znaków`),
    ).toBeInTheDocument();
  });
});
