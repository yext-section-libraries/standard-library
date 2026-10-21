import { z } from "zod";
import {
  entityFieldSchema,
  translatableRichTextSchema,
} from "../shared/generation/data.ts";
import { backgroundColorSchema } from "../shared/generation/colors.ts";
import { slotSchema } from "../shared/generation/slots.ts";
import { PuckComponent, Slot, SlotComponent } from "@puckeditor/core";
import {
  backgroundColors,
  SectionConfig,
  ThemeColor,
  ThemeOptions,
  msg,
  getAnalyticsScopeHash,
  FAQStruct,
  YextComponentConfig,
  YextFields,
  createSlottedItemSource,
} from "@yext/visual-editor";
import { PageSection } from "../shared/sectionSupport/atoms/pageSection.tsx";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import { HeadingTextProps } from "./HeadingText.tsx";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import {
  defaultFAQCardData,
  FAQCardProps,
} from "../shared/sectionSupport/pageSections/FAQsSection/FAQCard.tsx";
import {
  CardContextProvider,
  ComponentErrorBoundary,
} from "@yext/visual-editor/section-library-support";
import { EntityFieldSectionEmptyStateBox } from "../shared/sectionSupport/pageSections/EntityFieldSectionEmptyState.tsx";
import { MappedEntityFieldConditionalRender } from "../shared/sectionSupport/pageSections/entityFieldSectionUtils.ts";

export const faqSectionSchema = z.object({
  data: z
    .object({
      field: z.string(),
      constantValueEnabled: z.boolean().optional(),
      mappings: z
        .object({
          question: entityFieldSchema(translatableRichTextSchema.optional()),
          answer: entityFieldSchema(translatableRichTextSchema.optional()),
        })
        .optional(),
    })
    .describe(
      "Bind an entity FAQ list with question/answer mappings, or enable constants and author FAQCard children in CardSlot. Card references are assigned automatically. Linked cards use library defaults."
    ),
  styles: z.object({
    backgroundColor: backgroundColorSchema.optional(),
    showSectionHeading: z.boolean(),
  }),
  slots: z.object({
    HeadingSlot: slotSchema(),
    CardSlot: z
      .array(z.unknown())
      .describe(
        "Ordered FAQCard children for manual FAQs, or select the default cards. Leave empty or select defaults in linked mode."
      ),
  }),
  analytics: z.object({ scope: z.string().optional() }),
  liveVisibility: z.boolean(),
});

export interface FAQStyles {
  /**
   * The background color of the section.
   * @defaultValue Background Color 3
   */
  backgroundColor?: ThemeColor;

  /**
   * Whether to show the section heading.
   * @defaultValue true
   */
  showSectionHeading: boolean;
}

export interface FAQSectionProps {
  data: typeof faqCardsSource.value;

  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Style Props
   */
  styles: FAQStyles;

  slots: {
    HeadingSlot: Slot;
    CardSlot: Slot;
  };

  /** @internal */
  analytics: {
    scope?: string;
  };

  /** @internal */
  conditionalRender?: MappedEntityFieldConditionalRender;

  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility: boolean;
}

export const faqCardsSource = createSlottedItemSource<FAQStruct, FAQCardProps>({
  label: msg("fields.faqs", "FAQs"),
  itemLabel: "FAQ",
  cardName: "FAQCard",
  defaultItemProps: defaultFAQCardData().props,
  mappingFields: {
    question: {
      type: "entityField",
      label: msg("fields.question", "Question"),
      filter: {
        types: ["type.string", "type.rich_text_v2"],
      },
    },
    answer: {
      type: "entityField",
      label: msg("fields.answer", "Answer"),
      filter: {
        types: ["type.rich_text_v2"],
      },
    },
  },
});

const FAQsSectionFields: YextFields<FAQSectionProps> = {
  data: faqCardsSource.field,
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        type: "basicSelector",
        label: msg("fields.backgroundColor", "Background Color"),
        options: "BACKGROUND_COLOR",
      },
      showSectionHeading: {
        label: msg("fields.showSectionHeading", "Show Section Heading"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
    },
  },
  slots: {
    type: "object",
    objectFields: {
      HeadingSlot: { type: "slot", allow: [] },
      CardSlot: { type: "slot", allow: [] },
    },
    visible: false,
  },
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        label: msg("fields.scope", "Scope"),
        type: "text",
      },
    },
  },
  liveVisibility: {
    label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
    type: "radio",
    options: [
      { label: msg("fields.options.show", "Show"), value: true },
      { label: msg("fields.options.hide", "Hide"), value: false },
    ],
  },
};

const FAQsSectionLayout = ({
  styles,
  slots,
  cardsContent,
}: {
  styles: FAQSectionProps["styles"];
  slots: {
    HeadingSlot: SlotComponent;
    CardSlot: SlotComponent;
  };
  cardsContent?: React.ReactNode;
}) => {
  return (
    <PageSection
      background={styles.backgroundColor}
      className="flex flex-col gap-8 md:gap-12"
    >
      {styles.showSectionHeading && (
        <slots.HeadingSlot style={{ height: "auto" }} />
      )}
      {cardsContent ?? (
        <CardContextProvider>
          <slots.CardSlot />
        </CardContextProvider>
      )}
    </PageSection>
  );
};

const FAQsSectionComponent: PuckComponent<FAQSectionProps> = ({
  styles,
  slots,
}) => <FAQsSectionLayout styles={styles} slots={slots} />;

export const FAQSection: YextComponentConfig<FAQSectionProps> = {
  label: msg("components.faqs", "FAQs"),
  fields: FAQsSectionFields,
  layoutGenerationMetadata: {
    props: faqSectionSchema,
    slottedItemSource: faqCardsSource.generationMetadata,
  },
  defaultProps: {
    ...faqCardsSource.defaultWrapperProps,
    slots: {
      HeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            data: {
              text: {
                constantValue: { defaultValue: "Frequently Asked Questions" },
                constantValueEnabled: true,
                field: "",
              },
            },
            styles: { level: 2, align: "left" },
          } satisfies HeadingTextProps,
        },
      ],
      CardSlot: faqCardsSource.defaultWrapperProps.slots.CardSlot,
    },
    styles: {
      backgroundColor: backgroundColors.background2.value,
      showSectionHeading: true,
    },
    liveVisibility: true,
    analytics: {
      scope: "faqsSection",
    },
  },
  resolveData: (data, params) =>
    faqCardsSource.populateSlots(data, params.metadata.streamDocument),
  render: (props) => (
    <ComponentErrorBoundary
      isEditing={props.puck.isEditing}
      resetKeys={[props]}
    >
      <AnalyticsScopeProvider
        name={`${props.analytics?.scope ?? "faqsSection"}${getAnalyticsScopeHash(props.id)}`}
      >
        <VisibilityWrapper
          liveVisibility={props.liveVisibility}
          isEditing={props.puck.isEditing}
        >
          {props.conditionalRender?.isMappedContentEmpty ? (
            props.puck.isEditing ? (
              <FAQsSectionLayout
                styles={props.styles}
                slots={props.slots}
                cardsContent={<EntityFieldSectionEmptyStateBox />}
              />
            ) : (
              <></>
            )
          ) : (
            <FAQsSectionComponent {...props} />
          )}
        </VisibilityWrapper>
      </AnalyticsScopeProvider>
    </ComponentErrorBoundary>
  ),
};

export const config: SectionConfig = {
  id: "FAQSection",
  displayName: "FAQs",
  description:
    "Displays a list of questions and answers in an organized format. It includes a main heading for the section and typically renders the FAQs as an accordion, where users can click on a question to reveal the answer.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
