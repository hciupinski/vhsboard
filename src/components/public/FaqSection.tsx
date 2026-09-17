import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/faq";

type FaqSectionProps = {
  headingId: string;
  items: readonly FaqItem[];
  headerLabel?: string;
  description?: string;
};

export function FaqSection({ headingId, items, headerLabel, description }: FaqSectionProps) {
  return (
    <section className="border-t border-border bg-background" aria-labelledby={headingId}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Dobrze wiedzieć
        </p>
        <h2 id={headingId} className="mt-3 text-4xl leading-[0.95] uppercase sm:text-5xl">
          {headerLabel || "Najczęściej zadawane pytania"}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          { description || "Zebraliśmy najważniejsze informacje, żeby łatwiej było wybrać właściwy termin i ruszyć w drogę." }
        </p>
        <Accordion type="single" collapsible className="mt-8 border-t border-border">
          {items.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`faq-${index}`} className="border-border">
              <AccordionTrigger className="py-5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {question}
              </AccordionTrigger>
              <AccordionContent className="max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground text-justify">
                {answer
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, paragraphIndex) => (
                    <p key={`${question}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
