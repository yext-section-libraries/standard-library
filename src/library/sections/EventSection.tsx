import { type SurfaceValue } from "@yext/visual-editor/section-library-support";
import { Slot } from "@puckeditor/core";
import {
  ThemeOptions,
  msg,
  getAnalyticsScopeHash,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import { AnalyticsScopeProvider } from "@yext/pages-components";
import { defaultEventCardSlotData } from "../shared/sectionSupport/pageSections/EventSection/EventCard.tsx";
import { ComponentErrorBoundary } from "@yext/visual-editor/section-library-support";
import { forwardCardHeadingLevel } from "../shared/sectionSupport/pageSections/cardHeadingLevel.ts";
import {
  EventCardsWrapperProps,
  eventCardsSource,
} from "../shared/sectionSupport/pageSections/EventSection/EventCardsWrapper.tsx";
import {
  getMappedCardsSectionConditionalRender,
  MappedCardsSectionConditionalRender,
  MappedCardsSectionContent,
  MappedCardsSectionShell,
} from "../shared/sectionSupport/pageSections/mappedCardsSectionUtils.tsx";

export interface EventSectionProps {
  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Style Props
   */
  styles: {
    /**
     * The background color of the section.
     * @defaultValue Background Color 3
     */
    backgroundColor?: SurfaceValue;
    /**
     * Whether to show the section heading.
     * @defaultValue true
     */
    showSectionHeading: boolean;
  };

  /** @internal */
  slots: {
    SectionHeadingSlot: Slot;
    CardsWrapperSlot: Slot;
  };

  /** @internal */
  analytics: {
    scope?: string;
  };

  /** @internal */
  conditionalRender?: MappedCardsSectionConditionalRender;

  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility: boolean;
}

const eventSectionFields: YextFields<EventSectionProps> = {
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        generation: { required: false },
        type: "surface",
        label: msg("fields.backgroundColor", "Background Color"),
        allowInherit: false,
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
      SectionHeadingSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["HeadingTextSlot"],
      },
      CardsWrapperSlot: {
        generation: {
          singleChild: true,
        },
        type: "slot",
        allow: ["EventCardsWrapper"],
      },
    },
    visible: false,
  },
  analytics: {
    type: "object",
    label: msg("fields.analytics", "Analytics"),
    visible: false,
    objectFields: {
      scope: {
        generation: { required: false },
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

export const EventSection: YextComponentConfig<EventSectionProps> = {
  label: msg("components.events", "Events"),
  fields: eventSectionFields,
  defaultProps: {
    styles: {
      backgroundColor: "muted",
      showSectionHeading: true,
    },
    slots: {
      SectionHeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            data: {
              text: {
                constantValue: { defaultValue: "Upcoming Events" },
                constantValueEnabled: true,
                field: "",
              },
            },
            styles: { level: 2, align: "left" },
          },
        },
      ],
      CardsWrapperSlot: [
        {
          type: "EventCardsWrapper",
          props: {
            data: {
              field: "",
              constantValueEnabled: true,
              constantValue: [{}, {}, {}],
            },
            styles: {
              showImage: true,
              showDateTime: true,
              showDescription: true,
              showCTA: true,
            },
            slots: {
              CardSlot: [
                defaultEventCardSlotData(undefined, 0),
                defaultEventCardSlotData(undefined, 1),
                defaultEventCardSlotData(undefined, 2),
              ],
            },
          } satisfies EventCardsWrapperProps,
        },
      ],
    },
    analytics: {
      scope: "eventsSection",
    },
    liveVisibility: true,
  },
  resolveData: (data, params) => {
    const updatedData = forwardCardHeadingLevel(data);
    return {
      ...updatedData,
      props: {
        ...updatedData.props,
        conditionalRender: getMappedCardsSectionConditionalRender(
          updatedData.props.slots.CardsWrapperSlot?.[0],
          eventCardsSource.resolveItems(
            updatedData.props.slots.CardsWrapperSlot?.[0]?.props.data,
            params.metadata.streamDocument ?? {}
          )
        ),
      },
    };
  },
  render: (props) => (
    <ComponentErrorBoundary
      isEditing={props.puck.isEditing}
      resetKeys={[props]}
    >
      <AnalyticsScopeProvider
        name={`${props.analytics?.scope ?? "eventsSection"}${getAnalyticsScopeHash(props.id)}`}
      >
        <VisibilityWrapper
          liveVisibility={props.liveVisibility}
          isEditing={props.puck.isEditing}
        >
          <MappedCardsSectionShell
            conditionalRender={props.conditionalRender}
            isEditing={props.puck.isEditing}
            CardsWrapperSlot={props.slots.CardsWrapperSlot}
          >
            {(setCardsWrapperRef) => (
              <MappedCardsSectionContent
                backgroundColor={props.styles?.backgroundColor}
                showSectionHeading={props.styles.showSectionHeading}
                SectionHeadingSlot={props.slots.SectionHeadingSlot}
                CardsWrapperSlot={props.slots.CardsWrapperSlot}
                setCardsWrapperRef={setCardsWrapperRef}
              />
            )}
          </MappedCardsSectionShell>
        </VisibilityWrapper>
      </AnalyticsScopeProvider>
    </ComponentErrorBoundary>
  ),
};

export const config: SectionConfig = {
  id: "EventSection",
  displayName: "Events",
  description:
    "Display a curated list of events. It features a prominent section heading and renders each event as an individual card, making it ideal for showcasing upcoming activities, workshops, or promotions.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
