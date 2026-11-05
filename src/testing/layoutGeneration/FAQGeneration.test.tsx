import { resolveAllData } from "@puckeditor/core";
import { cleanup, render } from "@testing-library/react";
import { getDefaultRTF, resolveComponentData } from "@yext/visual-editor";
import { describe, expect, it } from "vitest";
import {
  FAQSection,
  faqCardsSource,
} from "../../library/sections/FAQSection.tsx";
import { HeadingText } from "../../library/sections/HeadingText.tsx";
import {
  FAQCard,
  defaultFAQCardData,
} from "../../library/shared/sectionSupport/pageSections/FAQsSection/FAQCard.tsx";
import { generationSchema } from "./generationTestUtils.ts";

const config = {
  components: { FAQSection, FAQCard, HeadingTextSlot: HeadingText },
};
const copy = <T,>(value: T): T => structuredClone(value);

const faqCardSchema = generationSchema("FAQCard");
const faqSectionSchema = generationSchema("FAQSection");

describe("FAQ generation contracts", () => {
  it.each(["question", "answer"])(
    "rejects generated %s JSON wrappers without renderable HTML",
    (name) => {
      for (const value of [
        { defaultValue: { json: "How often should I change my car’s oil?" } },
        { defaultValue: { json: getDefaultRTF("FAQ text").json } },
        { defaultValue: "FAQ text", fr: { json: "Texte" } },
      ]) {
        const card = copy(FAQCard.defaultProps!);
        expect(
          faqCardSchema.safeParse({
            ...card,
            data: {
              ...card.data,
              [name]: {
                field: "",
                constantValueEnabled: true,
                constantValue: value,
              },
            },
          }).success
        ).toBe(false);
      }
    }
  );

  it("renders generated plain and rich questions and localized answers", () => {
    for (const question of [
      "Oil change question?",
      getDefaultRTF("Oil change question?"),
    ]) {
      const card = copy(FAQCard.defaultProps!);
      const parsed = faqCardSchema.parse({
        ...card,
        data: {
          question: {
            field: "",
            constantValueEnabled: true,
            constantValue: { defaultValue: question },
          },
          answer: {
            field: "",
            constantValueEnabled: true,
            constantValue: {
              defaultValue: getDefaultRTF("Default answer"),
              fr: { html: "<p>Localized answer</p>" },
            },
          },
        },
      });
      const parsedData = parsed.data as any;
      const view = render(
        <>
          {resolveComponentData(
            parsedData.question,
            "fr",
            {},
            { output: "plainText" }
          )}
          {resolveComponentData(parsedData.answer, "fr", {})}
        </>
      );
      expect(view.container.textContent).toBe(
        "Oil change question?Localized answer"
      );
      cleanup();
    }
  });

  it("registers the shared slotted-source contract and excludes card references from authored data", () => {
    expect(FAQSection.layoutGenerationMetadata?.slottedItemSource).toBe(
      faqCardsSource.generationMetadata
    );
    expect(faqCardsSource.generationMetadata.cardType).toBe("FAQCard");
    const authored = faqSectionSchema.parse({
      ...FAQSection.defaultProps,
      data: { field: "", constantValueEnabled: true },
    });
    expect(authored.data).not.toHaveProperty("constantValue");
    expect(authored).not.toHaveProperty("manualSlots");
    expect(() => faqCardSchema.parse(FAQCard.defaultProps)).not.toThrow();
  });

  it("accepts entity-linked question and answer bindings", () => {
    const data = {
      field: "c_faqs",
      constantValueEnabled: false,
      mappings: {
        question: { field: "question", constantValueEnabled: false },
        answer: { field: "answer", constantValueEnabled: false },
      },
    };
    expect(
      faqSectionSchema.parse({ ...FAQSection.defaultProps, data }).data
    ).toEqual(data);
  });

  it.each(["question", "answer"])(
    "rejects manual %s content in mappings",
    (name) => {
      const mappingSchema = faqSectionSchema.shape.data.shape.mappings.unwrap();
      const mappings = {
        question: { field: "question", constantValueEnabled: false },
        answer: { field: "answer", constantValueEnabled: false },
      };
      for (const invalid of [
        { field: "", constantValueEnabled: true },
        {
          field: name,
          constantValueEnabled: false,
          constantValue: { defaultValue: "Manual content" },
        },
      ]) {
        expect(
          mappingSchema.safeParse({ ...mappings, [name]: invalid }).success
        ).toBe(false);
      }
    }
  );

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
