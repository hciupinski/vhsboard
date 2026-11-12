import { describe, expect, it } from "vitest";

import { aboutUsFaqItems, campFaqItems, tripFaqItems } from "./faq";

describe("public FAQ content", () => {
  it("uses all ten trip questions supplied by the client", () => {
    expect(tripFaqItems.map(({ question }) => question)).toEqual([
      "Czy muszę mieć doświadczenie na desce?",
      "Czy muszę samodzielnie organizować transport, nocleg i skipass?",
      "Jak wygląda dojazd na wyjazd?",
      "Czy muszę zabrać własny sprzęt?",
      "Z kim będę mieszkać na miejscu?",
      "Czy mogę pojechać na wyjazd bez własnej ekipy?",
      "Jak wyglądają szkolenia podczas wyjazdów?",
      "Kto prowadzi szkolenia podczas wyjazdów VHS?",
      "Czy VHS organizuje cały wyjazd?",
      "Jak zapisać się na wyjazd?",
    ]);
  });

  it("uses the revised camp answers and eight about-us answers", () => {
    expect(campFaqItems[0]!.answer.match(/Dokładny przedział wiekowy/g)).toHaveLength(1);
    expect(campFaqItems[1]!.answer).toContain(
      "Zajęcia dopasowujemy do poziomu umiejętności, aby każde dziecko mogło się uczyć i rozwijać we własnym tempie.",
    );
    expect(aboutUsFaqItems).toHaveLength(8);
    expect(aboutUsFaqItems[0]!.answer).toContain("to szkoła snowboardu i biuro podróży z Łodzi");
    expect(aboutUsFaqItems[1]!.answer).toContain("w Polskę za granicę");
    expect(aboutUsFaqItems[7]!.answer).toContain("Kameralne grupy, osobisty kontakt");
  });

  it("keeps six parent-focused camp questions", () => {
    expect(campFaqItems.map(({ question }) => question)).toEqual([
      "Dla dzieci w jakim wieku są obozy i półkolonie VHS?",
      "Czy dziecko musi już umieć jeździć na snowboardzie, wakeboardzie lub deskorolce?",
      "Kto opiekuje się uczestnikami obozów i półkolonii?",
      "Jak wygląda typowy dzień na obozie lub półkoloniach?",
      "Czy posiłki, transport i sprzęt są w cenie?",
      "Gdzie organizujemy obozy i półkolonie VHS?",
    ]);
  });
});
