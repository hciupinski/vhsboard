import { describe, expect, it } from "vitest";

import { campFaqItems, tripFaqItems } from "./faq";

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
