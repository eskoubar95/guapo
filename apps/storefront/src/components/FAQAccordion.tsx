"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  name: string;
  faqs: FAQItem[];
}

interface FAQAccordionProps {
  categories: FAQCategory[];
}

export function FAQAccordion({ categories }: FAQAccordionProps) {
  let valueIndex = 0;
  return (
    <div className="mt-8 space-y-12">
      {categories.map((category, i) => (
        <div key={i}>
          <h2 className="border-b border-border pb-3 text-xl font-semibold text-foreground">
            {category.name}
          </h2>
          <Accordion type="single" defaultValue={null} className="mt-4">
            {category.faqs.map((faq, j) => {
              const value = `faq-${valueIndex++}`;
              return (
                <AccordionItem key={value} value={value}>
                  <AccordionTrigger value={value}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent value={value}>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
