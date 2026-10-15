import {
  faqCardSchema,
  FAQCard,
  defaultFAQCardData,
} from "../library/shared/sectionSupport/pageSections/FAQsSection/FAQCard.tsx";
import {
  faqSectionSchema,
  FAQSection,
  faqCardsSource,
} from "../library/sections/FAQSection.tsx";
import { describe, expect, it } from "vitest";
import { resolveAllData } from "@puckeditor/core";
import { HeadingText } from "../library/sections/HeadingText.tsx";

const config = {
  components: { FAQSection, FAQCard, HeadingTextSlot: HeadingText },
};
const copy = <T,>(value: T): T => structuredClone(value);

describe("FAQ generation contracts", () => {
  it("registers the shared slotted-source contract and excludes card references from authored data", () => {
    expect(FAQSection.generation?.slottedItemSource).toBe(
      faqCardsSource.generation
    );
    expect(faqCardsSource.generation.cardType).toBe("FAQCard");
    const authored = faqSectionSchema.parse(FAQSection.defaultProps);
    expect(authored.data).not.toHaveProperty("constantValue");
    expect(authored).not.toHaveProperty("manualSlots");
    expect(() => faqCardSchema.parse(FAQCard.defaultProps)).not.toThrow();
  });

  it("resolves default FAQ cards with references and a preserved manual mirror", async () => {
    const candidate = {
      root: { props: {} },
      content: [
        {
          type: "FAQSection",
          props: {
            ...copy(FAQSection.defaultProps),
            id: "faq-section",
          },
        },
      ],
    };
    const resolved = await resolveAllData(candidate as any, config as any, {
      streamDocument: { locale: "en" },
    });
    const props = resolved.content[0].props as any;
    expect(props.slots.CardSlot).toHaveLength(3);
    expect(props.data.constantValue).toEqual(
      props.slots.CardSlot.map((card: any) => ({ id: card.props.id }))
    );
    expect(props.manualSlots.CardSlot).toEqual(props.slots.CardSlot);
    for (const card of props.slots.CardSlot) {
      expect(faqCardSchema.parse(card.props)).toEqual(
        JSON.parse(JSON.stringify(faqCardSchema.parse(FAQCard.defaultProps)))
      );
    }
  });

  it("preserves generated manual question content, styling and order through the real resolver", async () => {
    const first = defaultFAQCardData("first", 0, "lg");
    first.props.data.question.constantValue = {
      defaultValue: "Generated question",
    };
    const second = defaultFAQCardData("second", 1);
    const cards = [second, first];
    const candidate = {
      root: { props: {} },
      content: [
        {
          type: "FAQSection",
          props: {
            ...copy(FAQSection.defaultProps),
            id: "faq-section",
            data: {
              ...copy(faqCardsSource.defaultValue),
              constantValue: cards.map((card) => ({ id: card.props.id })),
            },
            slots: { ...copy(FAQSection.defaultProps!.slots), CardSlot: cards },
            manualSlots: { CardSlot: copy(cards) },
          },
        },
      ],
    };
    const resolved = await resolveAllData(candidate as any, config as any, {
      streamDocument: { locale: "en" },
    });
    const resolvedCards = (resolved.content[0].props as any).slots.CardSlot;
    expect(resolvedCards.map((card: any) => card.props.id)).toEqual([
      "second",
      "first",
    ]);
    expect(
      resolvedCards[1].props.data.question.constantValue.defaultValue
    ).toBe("Generated question");
    expect(resolvedCards[1].props.styles.questionVariant).toBe("lg");
  });
});
