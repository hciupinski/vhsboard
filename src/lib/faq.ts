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

export const eventsFaqItems: readonly FaqItem[] = [
  {
    question: "Na jakich eventach sprawdzi się tor skimboardowy lub strefa skate?",
    answer: "Nasze strefy sprawdzają się podczas eventów miejskich, pikników, festiwali, imprez firmowych, wydarzeń sportowych oraz akcji organizowanych przez centra handlowe. To atrakcje, które angażują uczestników, przyciągają uwagę i tworzą przestrzeń do aktywnej zabawy zarówno dla dzieci, młodzieży, jak i dorosłych.",
  },
  {
    question: "Czy tor skimboardowy można rozstawić w dowolnym miejscu?",
    answer: "Mobilny tor skimboardowy możemy zamontować w wielu różnych przestrzeniach – zarówno na zewnątrz, jak i w odpowiednio przygotowanych przestrzeniach eventowych. Przed realizacją ustalamy warunki techniczne, sprawdzamy nachylenie terenu, dostęp do wody, rodzaj nawierzchni oraz dostępną powierzchnię i dobieramy odpowiedni wariant toru do konkretnego miejsca.",
  },
  {
    question: "Czy VHS zajmuje się całą organizacją strefy?",
    answer: "Tak. Ty dajesz teren, my robimy resztę. Zapewniamy transport, montaż i demontaż strefy, sprzęt oraz – w zależności od wybranego wariantu – doświadczoną obsługę instruktorów. Przed wydarzeniem ustalamy również wszystkie kwestie techniczne, dzięki czemu organizacja atrakcji po stronie klienta jest ograniczona do minimum.",
  },
  {
    question: "Czym jest Strefa Skate VHS?",
    answer: "Strefa skate to przestrzeń do jazdy na deskorolce, rolkach, hulajnogach, yoyo itp. którą możemy stworzyć praktycznie w dowolnym miejscu. Zapewniamy przeszkody, deskorolki, kaski oraz doświadczonych instruktorów, którzy prowadzą zajęcia i pomagają postawić pierwsze kroki na desce. Strefę dopasowujemy do przestrzeni, charakteru wydarzenia i wieku uczestników.\n\n Nasze strefy skate są częścią zarówno mniejszych eventów, jak i dużych wydarzeń miejskich. Jedną z naszych realizacji była strefa przygotowana podczas Urodzin Łodzi – wydarzenia, które każdego roku przyciąga tysiące mieszkańców. To świetny przykład tego, jak skateboarding może stać się angażującą, aktywną atrakcją podczas dużego eventu plenerowego.",
  },
  {
    question: "Co obejmuje wynajem toru skimboardowego?",
    answer: "Wynajem może obejmować mobilny tor skimboardowy, montaż i demontaż, deski oraz niezbędne wyposażenie strefy. Możemy również zapewnić instruktorów, którzy pomagają uczestnikom rozpocząć zabawę i czuwają nad prawidłowym korzystaniem z toru. Zakres usługi dopasowujemy do czasu trwania, miejsca i charakteru wydarzenia.\n\n Dodatkowo możemy zaproponować stanowiska do nauki balansowania - trickboard; strefę maluszka dla dzieci od 0-7 lat oraz inne sportowe aktywności.",
  },
  {
    question: "Czy z toru skimboardowego i strefy skate mogą korzystać osoby początkujące?",
    answer: "Oczywiście. Nie trzeba wcześniej jeździć na skimboardzie czy deskorolce. Nasze strefy mają zachęcać do spróbowania sportów deskowych, dlatego są odpowiednie również dla osób, które robią to po raz pierwszy. Przy wariancie z obsługą instruktorzy pokazują podstawy i pomagają uczestnikom bezpiecznie rozpocząć jazdę.",
  },
  {
    question: "Gdzie organizujemy eventy skimboardowe i strefy skate?",
    answer: "Realizujemy eventy w całej Polsce, a także za granicą. Nasze mobilne strefy dopasowujemy do miejsca, charakteru wydarzenia i jego uczestników. Strefy wodne z torem skimboardowym świetnie sprawdzają się w centrach handlowych, podczas imprez firmowych, pikników i festiwali, a także jako atrakcja podczas wydarzeń i inicjatyw organizowanych dla mieszkańców przez miasta, gminy i urzędy. To sposób na stworzenie aktywnej, wakacyjnej przestrzeni, która przyciąga uwagę i angażuje uczestników wydarzenia.",
  },
];

export const campFaqItems: readonly FaqItem[] = [
  {
    question: "Dla dzieci w jakim wieku są obozy i półkolonie VHS?",
    answer:
      "Wiek uczestników zależy od konkretnego obozu lub turnusu półkolonii, ale przede wszystkim od dziecka. Organizujemy aktywne wyjazdy i półkolonie sportowe dla dzieci i młodzieży, a program oraz grupy dopasowujemy do wieku i poziomu uczestników. Dokładny przedział wiekowy zawsze znajdziesz w opisie wybranego turnusu.  Jeśli dziecko jest nieco młodsze niż wskazany przedział wiekowy, ale jest samodzielne i gotowe na udział w wyjeździe/półkolonii, po wcześniejszej konsultacji z rodzicami możemy dołączyć je do grupy. Dokładny przedział wiekowy zawsze znajdziesz w opisie wybranego turnusu.",
  },
  {
    question: "Czy dziecko musi już umieć jeździć na snowboardzie, wakeboardzie lub deskorolce?",
    answer:
      "Nie. Na nasze obozy i półkolonie zapraszamy zarówno dzieci, które dopiero zaczynają swoją przygodę ze sportami deskowymi, jak i bardziej doświadczonych uczestników, którzy chcą zrobić progres. Zajęcia dopasowujemy do poziomu umiejętności, tak aby każde dziecko mogło bezpiecznie się uczyć, rozwijać we własnym tempie.",
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
      "VHS – Village Head Snowboard, to łódzka szkoła snowboardu i organizator aktywnych wyjazdów, obozów oraz eventów związanych ze sportami deskowymi. Działamy od 2017 roku, łącząc snowboard, surfing, wakeboard, skimboard i deskorolkę. Tworzymy wyjazdy i wydarzenia dla dzieci, młodzieży i dorosłych – zawsze z naciskiem na dobrą atmosferę, progres i aktywnie spędzony czas.",
  },
  {
    question: "Jakie wyjazdy organizujemy?",
    answer:
      "Zimą organizujemy wyjazdy snowboardowe i narciarskie w Polsce oraz za granicą. Przygotowania do sezonu rozpoczynamy już w listopadzie wybierając na start całoroczne kryte hale np.  Snow Arena w Druskiennikach  czy austriackie lodowce, które pozwalają złapać formę i porządnie się rozjeździć. Od grudnia aż do kwietnia zajmujemy się szkoleniami oraz kursami dla osób początkujących jak i zaawansowanych. W tym czasie oferujemy tygodniowej wyjazdy, obozy dla dzieci jak i szybkie wypady weekendowe.\n\n Fani lata, wody i piaszczystych plaż mogą się z nami wybrać na surf campy. Regularnie jeździmy do Maroko, ale naszymi kierunkami były także Portugalia, Fuertaventura czy Hiszpania. Wraz z lokalnymi, doświadczonymi instruktorami uczymy łapania fal i bezpieczeństwa na wodzie. Praktykujemy też jogę i odkrywamy piękno miejsc, które inspirują – wszystko to w atmosferze relaksu, pasji i dobrej energii.",
  },
  {
    question: "Czy VHS jest szkołą snowboardu z Łodzi?",
    answer:
      "Tak. VHS to szkoła snowboardu i biuro podróży z Łodzi. Aczkolwiek jeżdżą z nami osoby z całej Polski.",
  },
  {
    question: "Czy organizujecie obozy i półkolonie sportowe dla dzieci i młodzieży?",
    answer:
      "Tak. Organizujemy obozy, wyjazdy oraz półkolonie sportowe dla dzieci i młodzieży. W zależności od sezonu program może obejmować m.in. snowboard, wakeboard, skimboard, deskorolkę, SUP oraz inne aktywności. Zależy nam na ruchu, dobrej zabawie, rozwijaniu umiejętności i budowaniu samodzielności – z dużą zajawką, bez sportowej musztry.",
  },
  {
    question: "Czym VHS zajmuje się zimą?",
    answer:
      "Zimą przenosimy się w góry. Organizujemy wyjazdy snowboardowe i narciarskie dla dzieci, młodzieży i dorosłych – zarówno w Polsce, jak i za granicą. Prowadzimy szkolenia na różnych poziomach zaawansowania, od pierwszych kroków na desce po doskonalenie techniki. Dbamy o całą organizację wyjazdu, komfort uczestników, dobrą atmosferę i przede wszystkim dużo czasu na stoku.",
  },
  {
    question: "Czym VHS zajmuje się latem?",
    answer:
      "Latem przenosimy się ze śniegu na wodę. Organizujemy półkolonie i zajęcia sportowe oraz profesjonalne eventy skimboardowe z wykorzystaniem mobilnych torów. Nasze strefy skimboardowe i skate sprawdzają się podczas eventów miejskich, pikników, imprez firmowych, festiwali oraz wydarzeń organizowanych przez centra handlowe.",
  },
  {
    question: "Czy VHS organizuje eventy skimboardowe w całej Polsce?",
    answer:
      "I nie tylko :) Nasze mobilne tory skimboardowe możemy rozstawić w różnych lokalizacjach w Polsce, a także za granicą. Zapewniamy transport, montaż i demontaż toru, sprzęt oraz – w zależności od wybranego wariantu – obsługę instruktorów. Dzięki mobilnej konstrukcji możemy stworzyć strefę skimboardową nawet w miejscu, które na co dzień nie ma nic wspólnego z surfingiem.",
  },
  {
    question: "Co wyróżnia VHS?",
    answer:
      "Nie tworzymy masowych wyjazdów. Stawiamy na kameralne grupy, indywidualne podejście, progres i ludzi. Chcemy znać uczestników, mieć czas na wspólną jazdę i tworzyć atmosferę, dzięki której po zakończeniu jednego wyjazdu zaczyna się myśleć o kolejnym. Sport jest dla nas punktem wyjścia – równie ważne są wspólne doświadczenia i relacje. Tak samo podchodzimy do eventów. Każdą strefę dopasowujemy do miejsca, wydarzenia i jego uczestników. Zapewniamy sprzęt, montaż, organizację i doświadczoną obsługę, tworząc aktywne strefy wodne, które angażują ludzi i przyciągają uwagę. ",
  },
];
