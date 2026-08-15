import heroSurf from "@/assets/hero-surf.jpg";
import tripSnow from "@/assets/trip-snow.jpg";
import aboutCrew from "@/assets/about-crew.jpg";
import galleryWave from "@/assets/gallery-wave.jpg";
import galleryChalet from "@/assets/gallery-chalet.jpg";
import galleryDinner from "@/assets/gallery-dinner.jpg";

export type Trip = {
  slug: string;
  tag: string;
  title: string;
  place: string;
  days: string;
  price: string;
  text: string;
  image: string;
  intro: string;
  description: string[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  schedule: { day: string; text: string }[];
  gallery: { src: string; alt: string }[];
};

export const trips: Trip[] = [
  {
    slug: "atlantic-surf-week",
    tag: "Surf",
    title: "Atlantycki Tydzień Surfingu",
    place: "Ericeira, Portugalia",
    days: "7 dni · 12-18 osób",
    price: "od 3 100 zł",
    text: "Poranne sesje o świcie, szkolenie dla każdego poziomu, busy na najlepiej pracujący spot i długie kolacje po wodzie.",
    image: heroSurf,
    intro:
      "Siedem dni na najbardziej pewnym odcinku europejskiego wybrzeża, z ekipą, która do wtorku zmienia się w przyjaciół.",
    description: [
      "Ericeira nie bez powodu jest Światowym Rezerwatem Surfingu: dziewięć dobrych spotów w promieniu dwudziestu minut, więc zawsze coś pracuje, niezależnie od wiatru. Codziennie ruszamy za falą busem, a prognozę czytamy razem przy śniadaniu.",
      "Poranki należą do wody — dwie prowadzone sesje dziennie, w małych grupach według poziomu, żeby początkujący złapali pewność w pianie, a bardziej zaawansowani dostali analizę wideo na rafie. Popołudnia są wasze: skatepark, spacer po klifach, hamak albo druga sesja, jeśli ręce jeszcze działają.",
      "Wieczory to ta część, o której mówi się później najwięcej. Wspólne kolacje na tarasie, grill na plaży i co najmniej jedno bardzo wątpliwe karaoke.",
    ],
    highlights: [
      "Dwie prowadzone sesje surfingu dziennie, każdy poziom",
      "Analiza wideo i warsztat czytania fal",
      "Grill na plaży i zachód słońca na klifach",
      "Wolne popołudnie na skate, jogę albo nic",
    ],
    included: [
      "6 nocy we wspólnym surf house (2-3 osoby w pokoju)",
      "Codzienne śniadania + 4 wspólne kolacje",
      "Deska i pianka na cały tydzień",
      "Szkolenie z certyfikowanymi instruktorami ISA",
      "Codzienny transport busem na najlepszy spot",
      "Odbiór z lotniska w Lizbonie i powrót",
      "Pakiet zdjęć i wideo z tygodnia",
    ],
    notIncluded: [
      "Loty do i z Lizbony",
      "Ubezpieczenie turystyczne i sportowe",
      "Obiady i 2 kolacje do wyboru",
      "Dopłata do pokoju jednoosobowego (+800 zł)",
      "Napoje i wydatki własne",
    ],
    schedule: [
      { day: "Dzień 1", text: "Odbiór w Lizbonie, zakwaterowanie, kolacja powitalna i omówienie prognozy." },
      { day: "Dni 2-6", text: "Poranna sesja, obiad, wolne popołudnie lub drugi surf, wspólna kolacja." },
      { day: "Dzień 4", text: "Opcja dnia wolnego: wędrówka wybrzeżem do Foz do Lizandro i obiad z owoców morza." },
      { day: "Dzień 7", text: "Sesja o wschodzie słońca, śniadanie, transfer do Lizbony." },
    ],
    gallery: [
      { src: galleryWave, alt: "Surfer tnący turkusową falę o zachodzie słońca w Ericeirze" },
      { src: heroSurf, alt: "Ekipa schodząca na plażę z deskami w złotej godzinie" },
      { src: galleryDinner, alt: "Długi stół z kolacją przy lampionach po dniu w wodzie" },
      { src: aboutCrew, alt: "Ekipa przy ognisku obok busa o zmierzchu" },
    ],
  },
  {
    slug: "powder-chase",
    tag: "Snow",
    title: "Pogoń za Puchem",
    place: "Chamonix, Francja",
    days: "6 dni · 10-16 osób",
    price: "od 3 800 zł",
    text: "Całe chalet tylko dla nas, prowadzone dni freeride, podstawy bezpieczeństwa lawinowego i après, które nigdy nie zawodzi.",
    image: tripSnow,
    intro:
      "Sześć dni w dolinie Mont Blanc z przewodnikami, którzy dokładnie wiedzą, gdzie chowa się dobry śnieg.",
    description: [
      "Bierzemy całe chalet dwadzieścia minut od wyciągów i robimy z niego bazę. Każdego ranka przewodnicy wybierają stok z najlepszym śniegiem — Grands Montets, Le Tour, Brévent albo cichą boczną dolinę, gdy w ośrodku robi się tłoczno.",
      "Grupa dzieli się na dwa poziomy: jedna oswaja się z jazdą poza trasą, druga szuka stromszych linii i krótkich podejść. Pierwszego dnia każdy przechodzi szkolenie lawinowe — detektor, sonda, łopata i ćwiczenia, które sprawiają, że to działa naprawdę.",
      "W chalet czeka sauna, wielka kuchnia i kucharz, który traktuje kolację poważnie. Après się zdarza, ale poranna pobudka też.",
    ],
    highlights: [
      "Prowadzone dni freeride w dwóch grupach poziomów",
      "Warsztat lawinowy z realnymi ćwiczeniami",
      "Sauna i chalet z widokiem na góry tylko dla nas",
      "Jeden zjazd o wschodzie słońca i jedno wyjście w Cham",
    ],
    included: [
      "5 nocy w prywatnym chalet z wyżywieniem",
      "Codzienne śniadania i kolacje oraz przekąski na trasę",
      "6-dniowy karnet Mont Blanc Unlimited",
      "Przewodnicy UIAGM w każdy dzień jazdy",
      "Sprzęt lawinowy (detektor, sonda, łopata)",
      "Transfery z lotniska w Genewie i codzienny bus pod wyciągi",
    ],
    notIncluded: [
      "Loty do Genewy",
      "Wypożyczenie deski lub nart (+550 zł za tydzień)",
      "Ubezpieczenie turystyczne i off-piste (obowiązkowe)",
      "Obiady na górze",
      "Napoje i kolejki na après",
    ],
    schedule: [
      { day: "Dzień 1", text: "Transfer z Genewy, zakwaterowanie, dobór sprzętu i odprawa lawinowa." },
      { day: "Dzień 2", text: "Rozjazdowe zjazdy w Le Tour, podział na grupy, ćwiczenia w terenie." },
      { day: "Dni 3-5", text: "Przewodnicy każdego ranka wybierają górę pod śnieg i wiatr." },
      { day: "Dzień 6", text: "Ostatnie poranne zjazdy, późny obiad w mieście, transfer do Genewy." },
    ],
    gallery: [
      { src: tripSnow, alt: "Snowboardziści zjeżdżający szerokim polem puchu w Alpach" },
      { src: galleryChalet, alt: "Ekipa odpoczywająca na tarasie chalet z deskami i kubkami" },
      { src: galleryDinner, alt: "Wspólny stół po dniu jazdy" },
      { src: aboutCrew, alt: "Ekipa śmiejąca się przy ogniu wieczorem" },
    ],
  },
  {
    slug: "sun-and-summit",
    tag: "Mix",
    title: "Słońce i Szczyty",
    place: "Maroko → Atlas Wysoki",
    days: "10 dni · 14-20 osób",
    price: "od 5 400 zł",
    text: "Najpierw poranki w wodzie w Taghazout, potem tydzień jazdy w Atlasie. Jedna ekipa, dwie pory roku, zero nudy.",
    image: aboutCrew,
    intro:
      "Dziesięć dni i dwa zupełnie różne place zabaw: najpierw atlantyckie point breaki, potem śnieg Wysokiego Atlasu.",
    description: [
      "Pierwszy tydzień to Taghazout — długie prawe fale, ciepła woda, mięta między sesjami i dach, który łapie każdy zachód słońca. To najbardziej przyjazne miejsce, jakie znamy, żeby zrobić realny postęp na desce.",
      "Potem jedziemy w głąb lądu. Oukaïmeden leży powyżej 2 600 m i od stycznia dostaje porządny śnieg — szerokie misy i prawie nikogo na nich. Jazda tam wydaje się sekretem, a przejazd przez wioski Atlasu to połowa wyjazdu.",
      "To nasz najdłuższy wyjazd i ten, który najmocniej zgrywa ekipę — dziesięć dni, jeden bus, dwa żywioły.",
    ],
    highlights: [
      "5 dni surfingu na point breakach Taghazout",
      "3 dni jazdy w Wysokim Atlasie w Oukaïmeden",
      "Widokowy road trip przez Atlas z postojami w wioskach",
      "Hammam, wieczór na suku i zachód słońca na skraju pustyni",
    ],
    included: [
      "9 nocy (willa surfingowa + pensjonat w górach)",
      "Wszystkie śniadania i 7 kolacji",
      "Sprzęt surfingowy i szkolenie w pierwszym tygodniu",
      "Lokalny przewodnik snowboardowy i karnet w drugim tygodniu",
      "Cały transport na miejscu razem z przejazdem przez Atlas",
      "Odbiór i odwóz z lotniska w Agadirze",
    ],
    notIncluded: [
      "Loty do Agadiru / z Marrakeszu",
      "Wypożyczenie deski w górach (+400 zł)",
      "Ubezpieczenie turystyczne",
      "Większość obiadów i 2 kolacje",
      "Napiwki, napoje i pamiątki",
    ],
    schedule: [
      { day: "Dni 1-5", text: "Taghazout: codzienne sesje surfingu, kolacje na dachu, jedno popołudnie w hammamie." },
      { day: "Dzień 6", text: "Road trip przez Atlas z postojami w wioskach i punktach widokowych." },
      { day: "Dni 7-9", text: "Oukaïmeden: prowadzone dni jazdy, wieczory w pensjonacie, tadżin na okrągło." },
      { day: "Dzień 10", text: "Poranek na suku w Marrakeszu i wylot." },
    ],
    gallery: [
      { src: aboutCrew, alt: "Ekipa przy ognisku obok busa o zmierzchu" },
      { src: galleryWave, alt: "Surfer na czystej fali point breaka" },
      { src: tripSnow, alt: "Snowboardziści na otwartym wysokogórskim stoku" },
      { src: galleryDinner, alt: "Wspólna kolacja przy lampionach na zewnątrz" },
    ],
  },
];

export const getTrip = (slug: string) => trips.find((t) => t.slug === slug);
