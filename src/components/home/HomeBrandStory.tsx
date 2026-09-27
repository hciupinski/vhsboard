import { Link } from "@tanstack/react-router";

import marioVhs from "@/assets/about-us/mario-vhs.jpg";
import { Button } from "@/components/ui/button";

export function HomeBrandStory() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
      <figure className="order-last lg:order-first">
        <img
          src={marioVhs}
          alt="Uczestnicy surf campu VHS ułożeni w znak VHS na plaży"
          width={1973}
          height={1315}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-3xl object-cover shadow-warm"
        />
      </figure>
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">O VHSBOARD</p>
        <h2 className="mt-3 text-4xl leading-[0.92] sm:text-6xl">
          NIEWAŻNE GDZIE. WAŻNE, ŻE NA DESCE
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          VHSBOARD działa od 2017 roku. Organizujemy wyjazdy surfingowe i snowboardowe, obozy
          sportowe dla dzieci i młodzieży oraz eventy z torem skimboardowym. Zawsze wokół tej samej
          zajawki: ruchu, ludzi i czasu spędzonego razem.
        </p>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Jesteśmy lokalnym biurem podróży. Nie interesuje nas masówka — wolimy kameralne wyjazdy,
          na których każdy jest częścią ekipy.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full">
          <Link to="/o-nas">Poznaj VHSBOARD</Link>
        </Button>
      </div>
    </section>
  );
}
