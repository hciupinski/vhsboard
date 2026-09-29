type DeferredYouTubeEmbedProps = {
  videoId: string;
  title: string;
  className?: string;
};

export function DeferredYouTubeEmbed({ videoId, title, className }: DeferredYouTubeEmbedProps) {
  return (
    <section className={className} aria-labelledby="camp-video-title">
      <h2 id="camp-video-title" className="text-3xl sm:text-4xl">
        Zobacz obozy w akcji
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl bg-foreground">
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title}
          loading="lazy"
          allowFullScreen
        />
      </div>
    </section>
  );
}
