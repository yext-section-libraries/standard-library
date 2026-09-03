import { PuckComponent, Slot } from "@puckeditor/core";
import {
  backgroundColors,
  ThemeColor,
  YextComponentConfig,
  YextFields,
  msg,
  SectionConfig,
} from "@yext/visual-editor";
import { PageSection } from "../shared/sectionSupport/atoms/pageSection.tsx";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import { ComponentErrorBoundary } from "@yext/visual-editor/section-library-support";

export interface VideoSectionProps {
  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Style Props
   */
  styles: {
    /**
     * The background color for the entire section, selected from the theme.
     * @defaultValue Background Color 1
     */
    backgroundColor?: ThemeColor;
  };

  slots: {
    SectionHeadingSlot: Slot;
    VideoSlot: Slot;
  };

  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility: boolean;
}

const videoSectionFields: YextFields<VideoSectionProps> = {
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        type: "basicSelector",
        label: msg("fields.backgroundColor", "Background Color"),
        options: "BACKGROUND_COLOR",
      },
    },
  },
  slots: {
    type: "object",
    objectFields: {
      SectionHeadingSlot: { type: "slot" },
      VideoSlot: { type: "slot" },
    },
    visible: false,
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

const VideoSectionComponent: PuckComponent<VideoSectionProps> = (props) => {
  const { slots, styles } = props;

  return (
    <PageSection background={styles.backgroundColor} className="flex flex-col">
      <slots.SectionHeadingSlot allow={[]} />
      <slots.VideoSlot allow={[]} />
    </PageSection>
  );
};

export const VideoSection: YextComponentConfig<VideoSectionProps> = {
  label: msg("components.videoSection", "Video Section"),
  fields: videoSectionFields,
  defaultProps: {
    styles: {
      backgroundColor: backgroundColors.background1.value,
    },
    slots: {
      SectionHeadingSlot: [
        {
          type: "HeadingTextSlot",
          props: {
            data: {
              text: {
                constantValue: { defaultValue: "" },
                constantValueEnabled: true,
                field: "",
              },
            },
            styles: { level: 2, align: "left" },
          },
        },
      ],
      VideoSlot: [
        {
          type: "VideoSlot",
          props: {
            data: {
              assetVideo: {},
            },
          },
        },
      ],
    },
    liveVisibility: true,
  },
  render: (props) => (
    <ComponentErrorBoundary
      isEditing={props.puck.isEditing}
      resetKeys={[props]}
    >
      <VisibilityWrapper
        liveVisibility={props.liveVisibility}
        isEditing={props.puck.isEditing}
      >
        <VideoSectionComponent {...props} />
      </VisibilityWrapper>
    </ComponentErrorBoundary>
  ),
};

export const config: SectionConfig = {
  id: "VideoSection",
  displayName: "Video Section",
  description: "Displays an embedded YouTube video.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
