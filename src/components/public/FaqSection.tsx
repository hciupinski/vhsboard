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
};

export function FaqSection({ headingId, items }: FaqSectionProps) {
  return (
    <section className="border-t border-border bg-background" aria-labelledby={headingId}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Dobrze wiedzieć
        </p>
        <h2 id={headingId} className="mt-3 text-4xl leading-[0.95] uppercase sm:text-5xl">
          Najczęściej zadawane pytania
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Zebraliśmy najważniejsze informacje, żeby łatwiej było wybrać właściwy termin i ruszyć w
          drogę.
        </p>
        <Accordion type="single" collapsible className="mt-8 border-t border-border">
          {items.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`faq-${index}`} className="border-border">
              <AccordionTrigger className="py-5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {question}
              </AccordionTrigger>
              <AccordionContent className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
