import { describe, expect, it } from "vitest";
import {
  contentSectionsSchema,
  emptyPrice,
  getSectionIssues,
  normalizeOfferContentV2,
} from "./content-v2";

describe("optional offer sections", () => {
  it("preserves an optional rental link setting including an explicit false", () => {
    expect(contentSectionsSchema.parse({ showRentalLink: true })).toEqual({ showRentalLink: true });
    expect(contentSectionsSchema.parse({ showRentalLink: false })).toEqual({
      showRentalLink: false,
    });
  });
  it("allows legacy content and disabled incomplete transport without requiring new data", () => {
    expect(contentSectionsSchema.parse({})).toEqual({});
    const content = { transport: { enabled: false, type: "coach", description: "", journeys: [] } };
    expect(getSectionIssues(content)).toEqual([]);
    expect(contentSectionsSchema.parse(content)).toEqual(content);
  });
  it("rejects publication of enabled incomplete transport while permitting a draft", () => {
    const content = { transport: { enabled: true, type: "coach", description: "", journeys: [] } };
    expect(contentSectionsSchema.safeParse(content).success).toBe(true);
    expect(getSectionIssues(content).map((i) => i.path.join("."))).toContain(
      "transport.description",
    );
  });
  it("retains disabled content and stable term IDs across normalization", () => {
    const content = {
      paragraphs: ["opis"],
      highlights: [],
      included: [],
      excluded: [],
      dayProgram: [],
      venueDescription: "miejsce",
      parentInfo: {
        ageRange: "7–14",
        supervision: "opieka",
        safety: "kaski",
        transport: "Autokar z Warszawy",
      },
      terms: [
        {
          label: "I",
          startDate: "2027-01-01",
          endDate: "2027-01-05",
          bookingUrl: "https://example.com",
          priceOptions: [],
        },
      ],
    };
    const first = normalizeOfferContentV2(content, "day_camp");
    expect(first).toMatchObject({
      schemaVersion: 2,
      transport: { enabled: false, description: "Autokar z Warszawy" },
    });
    expect(normalizeOfferContentV2(first, "day_camp")).toEqual(first);
    expect(first).toMatchObject({ terms: [{ id: expect.any(String), label: "I" }] });
  });
});

describe("v2 identity and publication validation", () => {
  it("allows a training introduction without cards but validates cards that are present", () => {
    const training = { enabled: true, description: "Lekcje na każdym poziomie.", items: [] };
    expect(getSectionIssues({ training })).toEqual([]);
    const partial = {
      ...training,
      items: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          title: "Jazda",
          description: "",
          price: emptyPrice(),
          level: "",
          scope: "",
        },
      ],
    };
    expect(getSectionIssues({ training: partial }).map((issue) => issue.path.join("."))).toEqual([
      "training.items.0.description",
    ]);
  });

  it("preserves a multiline price note and rejects oversized notes", () => {
    expect(contentSectionsSchema.parse({ priceNote: " Pierwsza linia.\nDruga linia. " })).toEqual({
      priceNote: "Pierwsza linia.\nDruga linia.",
    });
    expect(contentSectionsSchema.safeParse({ priceNote: "a".repeat(1001) }).success).toBe(false);
  });

  it("requires a journey for Bus VHS even when own transport is selected", () => {
    const transport = {
      enabled: true,
      types: ["own", "vhs_bus"],
      description: "Dojazd",
      journeys: [],
    };
    expect(contentSectionsSchema.parse({ transport })).toEqual({ transport });
    expect(getSectionIssues({ transport }).map((issue) => issue.path.join("."))).toEqual([
      "transport.journeys",
    ]);
    expect(getSectionIssues({ transport: { ...transport, types: ["own"] } })).toEqual([]);
  });

  it("validates transport choices and requires a label for a custom option", () => {
    const transport = { enabled: true, description: "Dojazd", journeys: [] };
    for (const types of [["own", "own"], ["invalid"]]) {
      expect(contentSectionsSchema.safeParse({ transport: { ...transport, types } }).success).toBe(
        false,
      );
    }
    expect(
      getSectionIssues({ transport: { ...transport, types: [] } }).map((issue) =>
        issue.path.join("."),
      ),
    ).toEqual(["transport.types"]);
    expect(
      getSectionIssues({ transport: { ...transport, types: ["other", "own"] } }).map((issue) =>
        issue.path.join("."),
      ),
    ).toContain("transport.customType");
  });

  it("keeps reporting other sections when a section fails structural validation", () => {
    const issues = getSectionIssues({
      priceNote: "a".repeat(1001),
      training: { enabled: true, description: "", items: [] },
    });
    expect(issues.map((issue) => issue.path.join("."))).toEqual([
      "priceNote",
      "training.description",
    ]);
  });

  it("points to the return time for a same-day journey ending before departure", () => {
    const issues = getSectionIssues({
      transport: {
        enabled: true,
        types: ["vhs_bus"],
        description: "Przejazd z VHS.",
        journeys: [
          {
            departureDate: "2027-01-15",
            departureTime: "15:00",
            departurePlace: "Łódź",
            returnDate: "2027-01-15",
            returnTime: "14:00",
            returnPlace: "Łódź",
            note: "",
          },
        ],
      },
    });
    expect(issues).toMatchObject([{ path: ["transport", "journeys", 0, "returnTime"] }]);
  });

  it("rejects duplicate card IDs before saving a draft", () => {
    const item = {
      id: "10000000-0000-4000-8000-000000000001",
      title: "",
      description: "",
      price: emptyPrice(),
      level: "",
      scope: "",
    };
    expect(
      contentSectionsSchema.safeParse({
        training: { enabled: false, description: "", items: [item, item] },
      }).success,
    ).toBe(false);
  });
  it.each(["2027-02-30", "2027-13-01", "2027-00-01"])(
    "rejects invalid calendar date %s",
    (date) => {
      expect(
        getSectionIssues({
          transport: {
            enabled: true,
            type: "coach",
            description: "Autokar",
            journeys: [
              {
                departureDate: date,
                returnDate: "2027-12-31",
                departureTime: "",
                returnTime: "",
                departurePlace: "Warszawa",
                returnPlace: "Warszawa",
                note: "",
              },
            ],
          },
        }).some((i) => i.path.join(".") === "transport.journeys.0.departureDate"),
      ).toBe(true);
    },
  );
  it("retains every disabled section across JSON save and reload", () => {
    const content = {
      resort: { enabled: false, name: "Miejsce", description: "", mapUrl: "" },
      training: { enabled: false, description: "", items: [] },
      transport: { enabled: false, type: "coach", description: "Opis roboczy", journeys: [] },
      insurance: {
        enabled: false,
        description: "",
        provider: "",
        informationUrl: "",
        packages: [],
        extensions: [],
      },
      accommodation: { enabled: false, description: "" },
    };
    const saved = contentSectionsSchema.parse(JSON.parse(JSON.stringify(content)));
    expect(saved).toEqual(content);
    expect(getSectionIssues(saved)).toEqual([]);
  });
  it("accepts insurance without coverage and rejects partially filled coverage", () => {
    const insurance = {
      enabled: true,
      description: "Opis ubezpieczenia",
      provider: "",
      informationUrl: "",
      packages: [],
      extensions: [],
    };
    expect(
      getSectionIssues({ insurance }).some(
        (issue) => issue.path.join(".") === "insurance.packages",
      ),
    ).toBe(true);
    const populated = {
      ...insurance,
      packages: [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          title: "Pakiet",
          description: "Opis pakietu",
          price: { kind: "included", amount: 0, from: false, unit: "" },
          risks: [{ id: "123e4567-e89b-12d3-a456-426614174001", label: "", value: "" }],
        },
      ],
    };
    expect(getSectionIssues({ insurance: populated })).toEqual([]);
    populated.packages[0]!.risks[0]!.label = "\t\n";
    populated.packages[0]!.risks[0]!.value = "\t";
    expect(getSectionIssues({ insurance: populated })).toEqual([]);
    populated.packages[0]!.risks[0]!.label = "Koszty leczenia";
    populated.packages[0]!.risks[0]!.value = "";
    expect(
      getSectionIssues({ insurance: populated }).some((issue) =>
        issue.path.join(".").endsWith("risks.0.value"),
      ),
    ).toBe(true);
  });
});
