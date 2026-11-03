import { setDeep, Slot } from "@puckeditor/core";
import { HeadingLevel } from "@yext/visual-editor";

export type CardHeadingLevelProps = {
  /** @internal Semantic heading level inherited from the section. */
  cardHeadingLevel?: HeadingLevel | "span";
};

export const forwardCardHeadingLevel = <
  T extends {
    props: { slots: { SectionHeadingSlot: Slot; CardsWrapperSlot: Slot } };
  },
>(
  data: T
): T => {
  if (!data.props.slots.CardsWrapperSlot?.[0]) {
    return data;
  }

  const sectionHeadingLevel = data.props.slots.SectionHeadingSlot?.[0]?.props
    .styles?.level as HeadingLevel | undefined;
  return setDeep(
    data,
    "props.slots.CardsWrapperSlot[0].props.cardHeadingLevel",
    sectionHeadingLevel && sectionHeadingLevel < 6
      ? sectionHeadingLevel + 1
      : "span"
  );
};

export const applyCardHeadingLevel = <
  T extends {
    props: CardHeadingLevelProps & { slots: { CardSlot: Slot } };
  },
>(
  data: T,
  headingSlot: string
): T => {
  if (data.props.cardHeadingLevel === undefined) {
    return data;
  }

  // Update final card slots after population, including newly generated cards.
  return data.props.slots.CardSlot.reduce((updatedData, card, index) => {
    if (!card.props.slots?.[headingSlot]?.[0]?.props) {
      return updatedData;
    }

    return setDeep(
      updatedData,
      `props.slots.CardSlot[${index}].props.slots.${headingSlot}[0].props.styles.semanticLevelOverride`,
      data.props.cardHeadingLevel
    );
  }, data);
};
