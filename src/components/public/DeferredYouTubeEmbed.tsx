import { useState } from "react";

import { Button } from "@/components/ui/button";

type DeferredYouTubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function DeferredYouTubeEmbed({ videoId, title, className }: DeferredYouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <section className={className} aria-labelledby="camp-video-title">
      <h2 id="camp-video-title" className="text-3xl sm:text-4xl">
        Zobacz obozy w akcji
      </h2>
      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-secondary/55 p-5 shadow-warm sm:p-6">
        {isLoaded ? (
          <iframe
            className="aspect-video w-full rounded-2xl"
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={title}
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <Button type="button" className="rounded-full" onClick={() => setIsLoaded(true)}>
            {`Odtwórz film: ${title}`}
          </Button>
        )}
        <a
          className="mt-4 inline-block underline underline-offset-4"
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
        >
          Obejrzyj na YouTube
        </a>
      </div>
    </section>
  );
}
