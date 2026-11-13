export type FaqItem = {
  question: string;
  answer: string;
  link?: { text: string; href: string };
};

export const tripFaqItems: readonly FaqItem[] = [
  {
    question: "Czy muszę mieć doświadczenie na desce?",
    answer:
      "Nie. Na wyjazdy VHS możesz jechać zarówno wtedy, gdy dopiero zaczynasz swoją przygodę ze snowboardem, nartami czy surfingiem, jak i wtedy, gdy masz już doświadczenie i chcesz zrobić kolejny progres. Szkolenia dopasowujemy do poziomu zaawansowania, dzięki czemu każdy może rozwijać się we własnym tempie.",
  },
  {
    question: "Czy muszę samodzielnie organizować transport, nocleg i skipass?",
    answer:
      "Nie. Chcemy, żeby wyjazd z VHS oznaczał przede wszystkim komfort i czas na jazdę, dlatego kwestie organizacyjne bierzemy na siebie. Planujemy transport, noclegi, skipassy, szkolenia i pozostałe elementy wyjazdu. Ty pakujesz deskę lub narty i jedziesz – resztą zajmujemy się my.",
  },
  {
    question: "Jak wygląda dojazd na wyjazd?",
    answer:
      "Forma transportu zależy od kierunku i charakteru wyjazdu. Organizujemy przejazdy naszym busem oraz pomagamy dobierać się we wspólne przejazdy. Zawsze możliwy jest również dojazd własny. Szczegółowe informacje dotyczące transportu, miejsca i godziny zbiórki przekazujemy uczestnikom przed wyjazdem.",
  },
  {
    question: "Czy muszę zabrać własny sprzęt?",
    answer:
      "Nie. Jeśli nie masz własnego snowboardu, czy innego potrzebnego sprzętu, w zależności od wyjazdu pomożemy w jego wypożyczeniu. Posiadamy wypożyczalnie snowboardów, butów snowboardowych oraz kasków. Jeśli masz swój sprzęt, oczywiście możesz zabrać go ze sobą.",
  },
  {
    question: "Z kim będę mieszkać na miejscu?",
    answer:
      "Pokoje staramy się dobierać tak, aby uczestnicy czuli się jak najbardziej komfortowo. Jeśli jedziesz ze znajomymi, partnerem lub rodziną, możesz zgłosić nam, że chcecie mieszkać razem. Jeśli jedziesz sam, dobierzemy Ci współlokatorów spośród pozostałych uczestników, a wcześniej postaramy się skonsultować wybór.",
  },
  {
    question: "Czy mogę pojechać na wyjazd bez własnej ekipy?",
    answer:
      "Jasne! Wiele osób zapisuje się na nasze wyjazdy samodzielnie. Stawiamy na kameralne grupy i dobrą atmosferę, dlatego szybko można poznać pozostałych uczestników. Niejedna ekipa, która dziś jeździ razem, poznała się właśnie podczas wyjazdu VHS.",
  },
  {
    question: "Jak wyglądają szkolenia podczas wyjazdów?",
    answer:
      "Szkolenia dopasowujemy do poziomu uczestników – od nauki podstaw po doskonalenie techniki i bardziej zaawansowaną jazdę. Zależy nam na realnym progresie, ale bez niepotrzebnej presji. Specjalizujemy się przede wszystkim we freestylu więc nauka salt, rotacji czy innych sztuczek na snowparku sprawia nam najwięcej frajdy.",
    link: { text: "freestylu", href: "https://www.youtube.com/watch?v=k4DNSx4JNlU" },
  },
  {
    question: "Kto prowadzi szkolenia podczas wyjazdów VHS?",
    answer:
      "Szkolenia prowadzi doświadczona i wykwalifikowana kadra instruktorów. To osoby, które mają nie tylko odpowiednie kompetencje, ale przede wszystkim doświadczenie na desce i w pracy z uczestnikami na różnych poziomach zaawansowania. Dbamy o bezpieczeństwo, dobrą atmosferę i indywidualne podejście.",
  },
  {
    question: "Czy VHS organizuje cały wyjazd?",
    answer:
      "Tak. Chcemy, żebyś mógł skupić się przede wszystkim na jeździe, odpoczynku i dobrze spędzonym czasie, dlatego kwestie organizacyjne bierzemy na siebie. W zależności od wyjazdu zajmujemy się transportem, noclegami, szkoleniami, skipassami i innymi elementami pobytu. Nie musisz samodzielnie składać całej podróży z kilku osobnych rezerwacji.",
  },
  {
    question: "Jak zapisać się na wyjazd?",
    answer:
      "Wybierz interesujący Cię wyjazd i przejdź do formularza zapisów dostępnego na stronie. Po zgłoszeniu otrzymasz informacje dotyczące rezerwacji, płatności i kolejnych kroków. Jeśli przed zapisem masz pytania, możesz również skontaktować się z nami bezpośrednio.",
  },
];

export const eventsFaqItems: readonly FaqItem[] = [
  {
    question: "Na jakich eventach sprawdzi się tor skimboardowy lub strefa skate?",
    answer:
      "Nasze strefy sprawdzają się podczas eventów miejskich, pikników, festiwali, imprez firmowych, wydarzeń sportowych oraz akcji organizowanych przez centra handlowe. To atrakcje, które angażują uczestników, przyciągają uwagę i tworzą przestrzeń do aktywnej zabawy zarówno dla dzieci, młodzieży, jak i dorosłych.",
  },
  {
    question: "Czy tor skimboardowy można rozstawić w dowolnym miejscu?",
    answer:
      "Mobilny tor skimboardowy możemy zamontować w wielu różnych przestrzeniach – zarówno na zewnątrz, jak i w odpowiednio przygotowanych przestrzeniach eventowych. Przed realizacją ustalamy warunki techniczne, sprawdzamy nachylenie terenu, dostęp do wody, rodzaj nawierzchni oraz dostępną powierzchnię i dobieramy odpowiedni wariant toru do konkretnego miejsca.",
  },
  {
    question: "Czy VHS zajmuje się całą organizacją strefy?",
    answer:
      "Tak. Ty dajesz teren, my robimy resztę. Zapewniamy transport, montaż i demontaż strefy, sprzęt oraz – w zależności od wybranego wariantu – doświadczoną obsługę instruktorów. Przed wydarzeniem ustalamy również wszystkie kwestie techniczne, dzięki czemu organizacja atrakcji po stronie klienta jest ograniczona do minimum.",
  },
  {
    question: "Czym jest Strefa Skate VHS?",
    answer:
      "Strefa skate to przestrzeń do jazdy na deskorolce, rolkach, hulajnogach, yoyo itp. którą możemy stworzyć praktycznie w dowolnym miejscu. Zapewniamy przeszkody, deskorolki, kaski oraz doświadczonych instruktorów, którzy prowadzą zajęcia i pomagają postawić pierwsze kroki na desce. Strefę dopasowujemy do przestrzeni, charakteru wydarzenia i wieku uczestników.\n\n Nasze strefy skate są częścią zarówno mniejszych eventów, jak i dużych wydarzeń miejskich. Jedną z naszych realizacji była strefa przygotowana podczas Urodzin Łodzi – wydarzenia, które każdego roku przyciąga tysiące mieszkańców. To świetny przykład tego, jak skateboarding może stać się angażującą, aktywną atrakcją podczas dużego eventu plenerowego.",
  },
  {
    question: "Co obejmuje wynajem toru skimboardowego?",
    answer:
      "Wynajem może obejmować mobilny tor skimboardowy, montaż i demontaż, deski oraz niezbędne wyposażenie strefy. Możemy również zapewnić instruktorów, którzy pomagają uczestnikom rozpocząć zabawę i czuwają nad prawidłowym korzystaniem z toru. Zakres usługi dopasowujemy do czasu trwania, miejsca i charakteru wydarzenia.\n\n Dodatkowo możemy zaproponować stanowiska do nauki balansowania - trickboard; strefę maluszka dla dzieci od 0-7 lat oraz inne sportowe aktywności.",
  },
  {
    question: "Czy z toru skimboardowego i strefy skate mogą korzystać osoby początkujące?",
    answer:
      "Oczywiście. Nie trzeba wcześniej jeździć na skimboardzie czy deskorolce. Nasze strefy mają zachęcać do spróbowania sportów deskowych, dlatego są odpowiednie również dla osób, które robią to po raz pierwszy. Przy wariancie z obsługą instruktorzy pokazują podstawy i pomagają uczestnikom bezpiecznie rozpocząć jazdę.",
  },
  {
    question: "Gdzie organizujemy eventy skimboardowe i strefy skate?",
    answer:
      "Realizujemy eventy w całej Polsce, a także za granicą. Nasze mobilne strefy dopasowujemy do miejsca, charakteru wydarzenia i jego uczestników. Strefy wodne z torem skimboardowym świetnie sprawdzają się w centrach handlowych, podczas imprez firmowych, pikników i festiwali, a także jako atrakcja podczas wydarzeń i inicjatyw organizowanych dla mieszkańców przez miasta, gminy i urzędy. To sposób na stworzenie aktywnej, wakacyjnej przestrzeni, która przyciąga uwagę i angażuje uczestników wydarzenia.",
  },
];

export const campFaqItems: readonly FaqItem[] = [
  {
    question: "Dla dzieci w jakim wieku są obozy i półkolonie VHS?",
    answer:
      "Wiek uczestników zależy od konkretnego obozu lub turnusu półkolonii, ale przede wszystkim od dziecka. Organizujemy aktywne wyjazdy i półkolonie sportowe dla dzieci i młodzieży, a program oraz grupy dopasowujemy do wieku i poziomu uczestników. Dokładny przedział wiekowy zawsze znajdziesz w opisie wybranego turnusu. Jeśli dziecko jest nieco młodsze niż wskazany przedział wiekowy, ale jest samodzielne i gotowe na udział w wyjeździe/półkolonii, po wcześniejszej konsultacji z rodzicami możemy dołączyć je do grupy.",
  },
  {
    question: "Czy dziecko musi już umieć jeździć na snowboardzie, wakeboardzie lub deskorolce?",
    answer:
      "Nie. Na nasze obozy i półkolonie zapraszamy zarówno dzieci, które dopiero zaczynają swoją przygodę ze sportami deskowymi, jak i bardziej doświadczonych uczestników, którzy chcą zrobić progres. Zajęcia dopasowujemy do poziomu umiejętności, aby każde dziecko mogło się uczyć i rozwijać we własnym tempie.",
  },
  {
    question: "Kto opiekuje się uczestnikami obozów i półkolonii?",
    answer:
      "Dziećmi i młodzieżą opiekuje się doświadczona kadra wychowawców i instruktorów. To osoby dla których snowboard, narty, wakeboard czy deskorolka są bardzo bliskie i które same od dziecka na nich jeżdżą. W naszym zespole są między innymi czołowi instruktorzy snowboardu, zdobywający topowe miejsca na ogólnopolskich zawodach, czy Mistrz Europy w skimboardingu.",
  },
  {
    question: "Jak wygląda typowy dzień na obozie lub półkoloniach?",
    answer:
      "Dużo się dzieje! Głównym punktem programu są zajęcia sportowe, ale przeplatamy je odpoczynkiem, wspólnymi aktywnościami, zabawami i dodatkowymi atrakcjami. Na półkoloniach wakeboardowych spędzamy 100% czasu na świeżym powietrzu. Niezależnie od sezonu program planujemy tak, żeby był czas na progres, integrację chill i po prostu dobrą zabawę.",
  },
  {
    question: "Czy posiłki, transport i sprzęt są w cenie?",
    answer:
      "Zakres ceny zależy od konkretnego obozu lub półkolonii. W cenie mogą znajdować się m.in. transport, zakwaterowanie, wyżywienie, szkolenia, opieka kadry, sprzęt oraz dodatkowe atrakcje. Dokładnie opisujemy, co obejmuje cena każdego turnusu oraz jakie ewentualne koszty należy uwzględnić dodatkowo.",
  },
  {
    question: "Gdzie organizujemy obozy i półkolonie VHS?",
    answer:
      "Nasze obozy i półkolonie organizujemy w topowych miejscach w Polsce, które wybieramy przede wszystkim pod kątem możliwości sportowych, infrastruktury i atrakcji dla uczestników. Zimą stawiamy na sprawdzone ośrodki narciarskie oferujące najlepsze snowparki w Polsce, przy jednoczesnym braku kolejek. Latem jeździmy pod Łódź, gdzie zlokalizowany jest najlepszy wakepark w Polsce.",
  },
];

export const aboutUsFaqItems: readonly FaqItem[] = [
  {
    question: "Kim jesteśmy?",
    answer:
      "VHS - to szkoła snowboardu i biuro podróży z Łodzi. Od 2017 roku organizujemy wyjazdy snowboardowe i narciarskie, obozy i półkolonie dla dzieci i młodzieży oraz eventy związane ze sportami deskowymi. Łączymy snowboard, surfing, wakeboard, skimboard i deskorolkę, tworząc okazje do nauki, wspólnej jazdy i poznawania ludzi.",
  },
  {
    question: "Jakie wyjazdy organizujemy?",
    answer:
      "Organizujemy wyjazdy snowboardowe i narciarskie, surf campy oraz obozy sportowe dla dzieci i młodzieży. W naszej ofercie znajdziesz zarówno dłuższe wyjazdy, jak i krótkie wypady - w Polskę za granicę. Aktualne kierunki i terminy sprawdzisz w zakładkach „Wyjazdy” oraz „Obozy”.",
  },
  {
    question: "Czy VHS jest szkołą snowboardu z Łodzi?",
    answer:
      "Tak. Działamy w Łodzi, ale jeżdżą z nami osoby z całej Polski. Możliwości transportu i dojazdu własnego opisujemy przy każdym wyjeździe.",
  },
  {
    question: "Czy organizujecie obozy i półkolonie dla dzieci i młodzieży?",
    answer:
      "Tak! Zimą organizujemy obozy snowboardowe i narciarskie, a latem obozy i półkolonie ze sportami deskowymi. W programie pojawiają się m.in. wakeboard, skimboard, deskorolka i SUP. Łączymy naukę z zabawą, a zajęcia dopasowujemy do wieku i umiejętności uczestników. Szczegółowy program oraz przedział wiekowy znajdziesz przy każdym turnusie.",
  },
  {
    question: "Czym VHS zajmuje się zimą?",
    answer:
      "Zimą najwięcej czasu spędzamy na stoku. Organizujemy wyjazdy snowboardowe i narciarskie, obozy oraz szkolenia dla początkujących i bardziej doświadczonych uczestników. Uczymy pierwszych skrętów, pomagamy doskonalić technikę i rozwijać freestyle - naszą szczególną zajawkę.",
  },
  {
    question: "Czym VHS zajmuje się latem?",
    answer:
      "Latem działamy na wodzie i w mieście. Organizujemy obozy i półkolonie sportowe, surf campy oraz eventy z mobilnymi torami skimboardowymi i strefami skate. Nasze aktywności pojawiają się na piknikach, festiwalach, imprezach firmowych i miejskich oraz w centrach handlowych.",
  },
  {
    question: "Czy organizujecie eventy skimboardowe w całej Polsce?",
    answer:
      "Tak - działamy w całej Polsce, a także za granicą. Zapewniamy transport, montaż i demontaż mobilnego toru, sprzęt oraz obsługę zgodną z wybranym wariantem oferty. Rozmiar toru i zakres strefy dopasowujemy do dostępnej przestrzeni oraz charakteru wydarzenia.",
  },
  {
    question: "Co wyróżnia VHS?",
    answer:
      "Kameralne grupy, osobisty kontakt i instruktorzy, którzy sami żyją sportami deskowymi. Chcemy znać uczestników, mieć czas na wspólną jazdę i pomagać każdemu robić postępy. Równie ważne są dla nas atmosfera i relacje, które zostają po wyjeździe. Do eventów podchodzimy równie indywidualnie - dopasowujemy strefę do miejsca, wydarzenia i jego uczestników.",
  },
];
