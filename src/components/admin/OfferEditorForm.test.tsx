import { required } from "@/test/required";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { sectionOffer } from "@/lib/offers/__fixtures__/sections";
import type { EditableOfferInput } from "@/lib/offers/editor-schema";

import { OfferEditorForm } from "./OfferEditorForm";

const completeInput: EditableOfferInput = {
  slug: "atlantic-surf-week",
  activity: "surf",
  title: "Atlantycki tydzień surfingu",
  subtitle: "Siedem dni w Ericeirze.",
  shortDescription: "Poranne sesje, dobry surf house i kolacje po wodzie.",
  content: {
    schemaVersion: 2,
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
  showLastPlacesBadge: false,
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
  it("retains transport text after disabling and reopening its optional section", async () => {
    const user = userEvent.setup();
    function Editor() {
      const [value, setValue] = useState(completeInput);
      return <OfferEditorForm value={value} errors={{}} disabled={false} onChange={setValue} />;
    }
    render(<Editor />);
    await user.click(screen.getByRole("tab", { name: "Transport" }));
    await user.click(screen.getByRole("switch", { name: "Pokaż sekcję w ofercie" }));
    fireEvent.change(screen.getByLabelText("Transport → Opis organizacyjny"), {
      target: { value: "Autokar z Warszawy." },
    });
    await user.click(screen.getByRole("switch", { name: "Pokaż sekcję w ofercie" }));
    await user.click(screen.getByRole("tab", { name: "Cena" }));
    await user.click(screen.getByRole("tab", { name: "Transport" }));
    await user.click(screen.getByRole("switch", { name: "Pokaż sekcję w ofercie" }));
    expect(screen.getByLabelText("Transport → Opis organizacyjny")).toHaveValue(
      "Autokar z Warszawy.",
    );
  });

  it("limits insurance packages to six and extensions to twelve with stable IDs", async () => {
    const user = userEvent.setup();
    let latest = {
      ...completeInput,
      content: { ...completeInput.content, insurance: sectionOffer().content.insurance },
    };
    function Editor() {
      const [value, setValue] = useState(latest);
      return (
        <OfferEditorForm
          value={value}
          errors={{}}
          disabled={false}
          onChange={(next) => {
            latest = next as typeof latest;
            setValue(next as typeof latest);
          }}
        />
      );
    }
    render(<Editor />);
    await user.click(screen.getByRole("tab", { name: "Ubezpieczenie" }));
    for (let i = 1; i < 6; i++)
      fireEvent.click(screen.getByRole("button", { name: `Dodaj kartę (${i}/6)` }));
    expect(screen.getByRole("button", { name: "Dodaj kartę (6/6)" })).toBeDisabled();
    for (let i = 1; i < 12; i++)
      fireEvent.click(screen.getByRole("button", { name: `Dodaj kartę (${i}/12)` }));
    expect(screen.getByRole("button", { name: "Dodaj kartę (12/12)" })).toBeDisabled();
    expect(new Set(latest.content.insurance!.packages.map((item) => item.id)).size).toBe(6);
    const firstId = latest.content.insurance!.packages[0]!.id;
    fireEvent.click(screen.getAllByRole("button", { name: "Niżej" })[0]!);
    expect(latest.content.insurance!.packages[1]!.id).toBe(firstId);
  });

  it("updates the last-places badge setting from the Basics tab", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole("switch", { name: "Pokaż tag: Ostatnie miejsca" }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...completeInput,
      showLastPlacesBadge: true,
    });
  });

  it("disables the last-places badge setting when day-camp editing is disabled", () => {
    render(<OfferEditorForm value={dayCampInput} errors={{}} disabled onChange={vi.fn()} />);

    expect(screen.getByRole("switch", { name: "Pokaż tag: Ostatnie miejsca" })).toBeDisabled();
  });

  it("generates a URL address from the offer title", async () => {
    const user = userEvent.setup();
    function StatefulForm() {
      const [value, setValue] = useState({ ...completeInput, slug: "" });
      return <OfferEditorForm value={value} errors={{}} disabled={false} onChange={setValue} />;
    }

    render(<StatefulForm />);

    expect(screen.getByLabelText("Adres URL oferty")).toHaveValue("");
    await user.clear(screen.getByLabelText("Tytuł wyjazdu"));
    await user.type(screen.getByLabelText("Tytuł wyjazdu"), "FOLGARIDA, Włochy 2027!");

    expect(screen.getByLabelText("Adres URL oferty")).toHaveValue("folgarida-wlochy-2027");
  });

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

  it("shows all trip sections in public order even when their content is empty", () => {
    render(
      <OfferEditorForm
        value={{
          ...completeInput,
          content: { paragraphs: [], highlights: [], included: [], excluded: [], schedule: [] },
        }}
        errors={{}}
        disabled={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Dane oferty",
      "O wyjeździe",
      "W programie",
      "Cena",
      "Zakwaterowanie",
      "Resort",
      "Szkolenia",
      "Transport",
      "Ubezpieczenie",
      "Galeria",
    ]);
  });

  it("enables optional accommodation and edits its description", async () => {
    const user = userEvent.setup();
    function StatefulForm() {
      const [value, setValue] = useState(completeInput);
      return <OfferEditorForm value={value} errors={{}} disabled={false} onChange={setValue} />;
    }
    render(<StatefulForm />);

    await user.click(screen.getByRole("tab", { name: "Zakwaterowanie" }));
    await user.click(screen.getByRole("switch", { name: "Włącz sekcję" }));
    expect(screen.getByLabelText("Opis zakwaterowania")).toHaveValue("");
    await user.clear(screen.getByLabelText("Opis zakwaterowania"));
    await user.type(screen.getByLabelText("Opis zakwaterowania"), "Apartament z tarasem.");
    expect(screen.getByLabelText("Opis zakwaterowania")).toHaveValue("Apartament z tarasem.");
  });

  it("adds an empty description item without mutating the current value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
    await user.click(required(screen.getAllByRole("button", { name: "Dodaj pozycję" })[0]));

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
    expect(screen.queryByLabelText("W programie 1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "W programie" }));
    expect(screen.getByLabelText("W programie 1")).toHaveValue("Dwie sesje dziennie");
    expect(screen.queryByLabelText("Akapity opisu 1")).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("tab", { name: "W programie" }));
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
    expect(required(value.content.schedule[1]).text).toBe("Pierwsza sesja.");
  });

  it("adds a numbered part rather than a pre-grouped day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={onChange} />,
    );

    await user.click(screen.getByRole("tab", { name: "W programie" }));
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
    expect(screen.getByLabelText("Zdanie wprowadzające")).toBeDisabled();
    expect(screen.getByLabelText("Adres zapisów")).toBeDisabled();
    expect(screen.getByLabelText("Rodzaj wyjazdu")).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
    expect(required(screen.getAllByRole("button", { name: "Dodaj pozycję" })[0])).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "W programie" }));
    expect(screen.getByLabelText("W programie 1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dodaj pozycję" })).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "Cena" }));
    expect(screen.getByLabelText("W cenie 1")).toBeDisabled();
    expect(screen.getByLabelText("Poza ceną 1")).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "W programie" }));
    expect(screen.getByRole("button", { name: "Dodaj dzień" })).toBeDisabled();
  });

  it("shows image readiness without exposing an image URL or path input", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("tab", { name: "Galeria" }));

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

    await user.click(screen.getByRole("tab", { name: "Galeria" }));

    expect(screen.getByText("Panel zarządzania zdjęciami")).toBeInTheDocument();
    expect(screen.queryByText("Najpierw zapisz szkic, aby dodać zdjęcia.")).not.toBeInTheDocument();
  });

  it("edits terms, price variants and the day-camp programme", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={dayCampInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("tab", { name: "Cena" }));
    expect(screen.getByText("Turnusy i warianty cen")).toBeInTheDocument();
    expect(screen.getByLabelText("Turnus 1, wariant 1 — cena")).toHaveValue(1290);
    expect(screen.getByLabelText("Turnus 1 — adres zapisów")).toHaveValue(
      "https://zapisy.example/wake-lipiec",
    );
    expect(screen.queryByText("Plan zajęć")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "W programie" }));
    expect(screen.getByLabelText("Plan dnia 1 — godzina")).toHaveValue("09:00");
    expect(screen.getByText("5/120 znaków")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Dla rodzica" }));
    expect(screen.getByLabelText("Wiek uczestników")).toHaveValue("8–14 lat");
  });

  it("keeps trip subtitle in basics and preserves edits across the separate panels", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Editor() {
      const [value, setValue] = useState(completeInput);
      return (
        <OfferEditorForm
          value={value}
          errors={{}}
          disabled={false}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }
    render(<Editor />);
    fireEvent.change(screen.getByLabelText("Zdanie wprowadzające"), {
      target: { value: "Nowe wprowadzenie." },
    });
    await user.click(screen.getByRole("tab", { name: "O wyjeździe" }));
    expect(screen.queryByLabelText("Zdanie wprowadzające")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Akapity opisu 1"), { target: { value: "Nowy opis." } });
    await user.click(screen.getByRole("tab", { name: "W programie" }));
    fireEvent.change(screen.getByLabelText("W programie 1"), {
      target: { value: "Surf o świcie" },
    });
    await user.click(screen.getByRole("tab", { name: "Dane oferty" }));
    expect(screen.getByLabelText("Zdanie wprowadzające")).toHaveValue("Nowe wprowadzenie.");
    expect(onChange).toHaveBeenLastCalledWith({
      ...completeInput,
      subtitle: "Nowe wprowadzenie.",
      content: {
        ...completeInput.content,
        paragraphs: ["Nowy opis."],
        highlights: ["Surf o świcie"],
      },
    });
  });

  it("marks only the trip tab containing each invalid field", () => {
    const props = { value: completeInput, disabled: false, onChange: vi.fn() };
    const { rerender } = render(<OfferEditorForm {...props} errors={{}} />);
    const cases: (readonly [string, string])[] = [
      ...[
        "offerKind",
        "activity",
        "title",
        "slug",
        "location",
        "subtitle",
        "shortDescription",
        "startDate",
        "endDate",
        "durationDays",
        "groupSizeMin",
        "groupSizeMax",
        "priceFrom",
        "currency",
        "bookingUrl",
      ].map((path) => [path, "Dane oferty"] as const),
      ["content.paragraphs.0", "O wyjeździe"],
      ["content.highlights.0", "W programie"],
      ["content.schedule.0.text", "W programie"],
      ["content.included.0", "Cena"],
      ["content.excluded.0", "Cena"],
      ["heroImagePath", "Galeria"],
    ];
    for (const [path, tab] of cases) {
      rerender(<OfferEditorForm {...props} errors={{ [path]: "Popraw to pole." }} />);
      expect(screen.getByRole("tab", { name: `${tab} — zawiera błędy` })).toBeInTheDocument();
      expect(screen.getAllByRole("tab", { name: /zawiera błędy/ })).toHaveLength(1);
    }
  });

  it("reveals a focused offscreen tab inside the horizontal scroller", () => {
    render(
      <OfferEditorForm value={completeInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );
    const tablist = screen.getByRole("tablist");
    const gallery = screen.getByRole("tab", { name: "Galeria" });
    vi.spyOn(tablist, "getBoundingClientRect").mockReturnValue({ left: 10, right: 330 } as DOMRect);
    vi.spyOn(gallery, "getBoundingClientRect").mockReturnValue({
      left: 580,
      right: 670,
    } as DOMRect);
    fireEvent.focus(gallery);
    expect(tablist.scrollLeft).toBe(340);
    const basics = screen.getByRole("tab", { name: "Dane oferty" });
    vi.spyOn(basics, "getBoundingClientRect").mockReturnValue({
      left: -330,
      right: -240,
    } as DOMRect);
    fireEvent.focus(basics);
    expect(tablist.scrollLeft).toBe(0);
  });

  it("preserves day-camp tab order and story fields", async () => {
    const user = userEvent.setup();
    render(
      <OfferEditorForm value={dayCampInput} errors={{}} disabled={false} onChange={vi.fn()} />,
    );
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Dane oferty",
      "O obozie",
      "W programie",
      "Cena",
      "Dla rodzica",
      "Zakwaterowanie",
      "Resort",
      "Szkolenia",
      "Transport",
      "Ubezpieczenie",
      "Galeria",
    ]);
    expect(screen.queryByLabelText("Zdanie wprowadzające")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "O obozie" }));
    expect(screen.getByLabelText("Zdanie wprowadzające")).toHaveValue(dayCampInput.subtitle);
    expect(screen.queryByLabelText("Atrakcje 1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "W programie" }));
    expect(screen.getByLabelText("Atrakcje 1")).toHaveValue("Małe grupy");
  });

  it("moves the legacy camp venue into the resort editor without losing its text", async () => {
    if (!("venueDescription" in dayCampInput.content)) throw new Error("expected camp content");
    const venueDescription = dayCampInput.content.venueDescription;
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <OfferEditorForm value={dayCampInput} errors={{}} disabled={false} onChange={onChange} />,
    );
    await user.click(screen.getByRole("tab", { name: "Resort" }));
    expect(screen.getByLabelText("Resort → Opis miejsca zajęć")).toHaveValue(venueDescription);
    await user.click(screen.getByRole("switch", { name: "Pokaż sekcję w ofercie" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          venueDescription,
          resort: expect.objectContaining({
            enabled: true,
            name: dayCampInput.location,
            description: venueDescription,
          }),
        }),
      }),
    );
  });

  it("keeps day-camp validation markers with their existing panels", () => {
    const props = { value: dayCampInput, disabled: false, onChange: vi.fn() };
    const { rerender } = render(<OfferEditorForm {...props} errors={{}} />);
    for (const [path, tab] of [
      ["content.terms.0.bookingUrl", "Cena"],
      ["subtitle", "O obozie"],
      ["content.highlights.0", "W programie"],
      ["content.venueDescription", "Resort"],
      ["content.dayProgram.0.time", "W programie"],
      ["content.parentInfo.safety", "Dla rodzica"],
      ["content.included.0", "Cena"],
    ] as const) {
      rerender(<OfferEditorForm {...props} errors={{ [path]: "Popraw to pole." }} />);
      expect(screen.getByRole("tab", { name: `${tab} — zawiera błędy` })).toBeInTheDocument();
      expect(screen.getAllByRole("tab", { name: /zawiera błędy/ })).toHaveLength(1);
    }
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
