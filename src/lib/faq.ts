export type FaqItem = {
  question: string;
  answer: string;
};

export const tripFaqItems: readonly FaqItem[] = [
  {
    question: "Czy muszę mieć doświadczenie na desce?",
    answer:
      "Każda oferta opisuje poziom, dla którego jest przygotowana. Jeśli zaczynasz, wybierz termin oznaczony jako odpowiedni dla początkujących; przed zapisem sprawdź opis wyjazdu lub napisz do VHSBOARD.",
  },
  {
    question: "Co obejmuje cena wyjazdu?",
    answer:
      "Zakres świadczeń jest podany przy każdym terminie. W szczegółach znajdziesz informacje o noclegach, zajęciach, transferach, sprzęcie i pozycjach opłacanych osobno.",
  },
  {
    question: "Jak wygląda dojazd na wyjazd?",
    answer:
      "Sposób dojazdu zależy od kierunku. Informację o miejscu zbiórki, transferach i organizacji podróży publikujemy w opisie konkretnej oferty.",
  },
  {
    question: "Czy muszę zabrać własny sprzęt?",
    answer:
      "To zależy od programu i poziomu zaawansowania. Lista rzeczy do zabrania oraz dostępność sprzętu są zawsze opisane przy danym wyjeździe.",
  },
  {
    question: "Z kim będę mieszkać na miejscu?",
    answer:
      "Informacje o rodzaju zakwaterowania i układzie pokoi podajemy w szczegółach oferty. Jedziesz samodzielnie? To normalne — wyjazdy są pomyślane tak, aby łatwo poznać ekipę.",
  },
  {
    question: "Jak zapisać się na wyjazd?",
    answer:
      "Wejdź w wybrany termin i użyj przycisku zapisów prowadzącego do TripAhead. Po drodze sprawdzisz aktualną cenę, dostępność oraz zasady rezerwacji.",
  },
];

export const campFaqItems: readonly FaqItem[] = [
  {
    question: "Dla dzieci w jakim wieku są obozy?",
    answer:
      "Przedział wieku i poziom aktywności podajemy przy każdym turnusie. Dzięki temu rodzic może wybrać program odpowiedni dla dziecka.",
  },
  {
    question: "Czy dziecko musi już umieć jeździć?",
    answer:
      "Nie każdy obóz wymaga wcześniejszego doświadczenia. Opis turnusu wskazuje, czy przyjmujemy osoby początkujące i jak dzielimy grupy według umiejętności.",
  },
  {
    question: "Kto opiekuje się uczestnikami?",
    answer:
      "Zajęcia prowadzą instruktorzy, a organizacja dnia i opieka są opisane przy wybranym turnusie. Przed zapisem warto sprawdzić również informacje dla rodziców na stronie oferty.",
  },
  {
    question: "Jak wygląda typowy dzień na obozie?",
    answer:
      "Program łączy aktywności na desce, przerwy na odpoczynek i czas z grupą. Dokładny plan dnia zależy od sezonu, miejsca oraz rodzaju turnusu.",
  },
  {
    question: "Czy posiłki, transport i sprzęt są w cenie?",
    answer:
      "Te elementy różnią się między obozami. Aktualny zakres świadczeń oraz ewentualne rzeczy do zabrania znajdziesz w opisie konkretnego terminu.",
  },
  {
    question: "Jak zapisać dziecko na obóz?",
    answer:
      "Otwórz wybrany turnus i przejdź przez przycisk zapisów do TripAhead. Przed potwierdzeniem sprawdzisz cenę, dostępność i informacje organizacyjne.",
  },
];
