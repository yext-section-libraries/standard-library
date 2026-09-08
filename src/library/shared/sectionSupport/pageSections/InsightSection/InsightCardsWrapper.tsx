import {
  InsightStruct,
  msg,
  ThemeOptions,
  YextComponentConfig,
  YextFields,
  createSlottedItemSource,
} from "@yext/visual-editor";
import { PuckComponent } from "@puckeditor/core";
import {
  CardContextProvider,
  SlotMappedCardWrapperType,
} from "@yext/visual-editor/section-library-support";
import {
  defaultInsightCardSlotData,
  InsightCardProps,
} from "./InsightCard.tsx";
import { renderMappedEntityFieldEmptyState } from "../EntityFieldSectionEmptyState.tsx";
import { MappedEntityFieldConditionalRender } from "../entityFieldSectionUtils.ts";

export const insightCardsSource = createSlottedItemSource<
  InsightStruct,
  InsightCardProps
>({
  label: msg("components.insights", "Insights"),
  itemLabel: "Insight",
  cardName: "InsightCard",
  defaultItemProps: () => defaultInsightCardSlotData().props,
  mappingFields: {
    image: {
      type: "entityField",
      label: msg("fields.image", "Image"),
      filter: { types: ["type.image"] },
    },
    name: {
      type: "entityField",
      label: msg("fields.title", "Title"),
      filter: { types: ["type.string"] },
    },
    category: {
      type: "entityField",
      label: msg("fields.category", "Category"),
      filter: { types: ["type.string", "type.rich_text_v2"] },
    },
    publishTime: {
      type: "entityField",
      label: msg("fields.publishTime", "Publish Time"),
      filter: { types: ["type.datetime"] },
    },
    description: {
      type: "entityField",
      label: msg("fields.description", "Description"),
      filter: { types: ["type.rich_text_v2"] },
    },
    cta: {
      type: "entityField",
      label: msg("fields.cta", "CTA"),
      filter: { types: ["type.cta"] },
    },
  },
});

export type InsightCardsWrapperProps =
  SlotMappedCardWrapperType<InsightStruct> & {
    styles: {
      showImage: boolean;
      showCategory: boolean;
      showPublishTime: boolean;
      showDescription: boolean;
      showCTA: boolean;
    };

    /** @internal */
    conditionalRender?: MappedEntityFieldConditionalRender;
  };

const insightCardsWrapperFields: YextFields<InsightCardsWrapperProps> = {
  data: insightCardsSource.field,
  slots: {
    type: "object",
    objectFields: {
      CardSlot: { type: "slot" },
    },
    visible: false,
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      showImage: {
        label: msg("fields.showImage", "Show Image"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showCategory: {
        label: msg("fields.showCategory", "Show Category"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showPublishTime: {
        label: msg("fields.showPublishTime", "Show Publish Time"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showDescription: {
        label: msg("fields.showDescription", "Show Description"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
      showCTA: {
        label: msg("fields.showCTA", "Show CTA"),
        type: "radio",
        options: ThemeOptions.SHOW_HIDE,
      },
    },
  },
};

const InsightCardsWrapperComponent: PuckComponent<InsightCardsWrapperProps> = (
  props
) => {
  const { slots } = props;

  return (
    <CardContextProvider parentStyles={props.styles}>
      <slots.CardSlot
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 align-stretch"
        allow={[]}
      />
    </CardContextProvider>
  );
};

export const InsightCardsWrapper: YextComponentConfig<InsightCardsWrapperProps> =
  {
    label: msg("slots.insightCards", "Insight Cards"),
    fields: insightCardsWrapperFields,
    defaultProps: {
      ...insightCardsSource.defaultWrapperProps,
      styles: {
        showImage: true,
        showCategory: true,
        showPublishTime: true,
        showDescription: true,
        showCTA: true,
      },
    },
    resolveData: (data, params) =>
      insightCardsSource.populateSlots(data, params.metadata.streamDocument),
    render: (props) => {
      if (props.conditionalRender?.isMappedContentEmpty) {
        return renderMappedEntityFieldEmptyState(props.puck.isEditing);
      }

      return <InsightCardsWrapperComponent {...props} />;
    },
  };
