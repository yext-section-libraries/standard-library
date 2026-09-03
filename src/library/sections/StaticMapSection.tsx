import {
  backgroundColors,
  ThemeColor,
  msg,
  YextComponentConfig,
  YextFields,
  SectionConfig,
} from "@yext/visual-editor";
import { PageSection } from "../shared/sectionSupport/atoms/pageSection.tsx";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";
import {
  MapboxStaticMapComponent,
  mapStyleField,
} from "../shared/sectionSupport/contentBlocks/MapboxStaticMap.tsx";
import { PuckComponent } from "@puckeditor/core";
import { ComponentErrorBoundary } from "@yext/visual-editor/section-library-support";

export interface StaticMapStyles {
  /**
   * The background color of the section.
   * @defaultValue Background Color 1
   */
  backgroundColor?: ThemeColor;

  /**
   * The style of the map to be displayed.
   * @defaultValue Default (streets-v12)
   */
  mapStyle: string;
}

export interface StaticMapSectionProps {
  /**
   * If 'true', the component is visible on the live page; if 'false', it's hidden.
   * @defaultValue true
   */
  liveVisibility: boolean;

  /**
   * This object contains properties for customizing the component's appearance.
   * @propCategory Styles Props
   */
  styles: StaticMapStyles;
}

const staticMapSectionFields: YextFields<StaticMapSectionProps> = {
  liveVisibility: {
    label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
    type: "radio",
    options: [
      { label: msg("fields.options.show", "Show"), value: true },
      { label: msg("fields.options.hide", "Hide"), value: false },
    ],
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      backgroundColor: {
        type: "basicSelector",
        label: msg("fields.backgroundColor", "Background Color"),
        options: "BACKGROUND_COLOR",
      },
      mapStyle: mapStyleField,
    },
  },
};

const StaticMapSectionWrapper: PuckComponent<StaticMapSectionProps> = ({
  styles,
  puck,
  id,
}) => {
  return (
    <PageSection
      background={styles?.backgroundColor}
      className={`flex items-center`}
    >
      <MapboxStaticMapComponent
        coordinate={{
          field: "yextDisplayCoordinate",
          constantValue: {
            latitude: 0,
            longitude: 0,
          },
        }}
        mapStyle={styles?.mapStyle}
        puck={puck}
        id={id}
      />
    </PageSection>
  );
};

export const StaticMapSection: YextComponentConfig<StaticMapSectionProps> = {
  label: msg("components.staticMapSection", "Static Map Section"),
  fields: staticMapSectionFields,
  defaultProps: {
    liveVisibility: true,
    styles: {
      backgroundColor: backgroundColors.background1.value,
      mapStyle: "streets-v12",
    },
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
        <StaticMapSectionWrapper {...props} />
      </VisibilityWrapper>
    </ComponentErrorBoundary>
  ),
};

export const config: SectionConfig = {
  id: "StaticMapSection",
  displayName: "Static Map Section",
  description:
    "Displays a non-interactive map image of a business's location. It uses the entity's address or coordinates to generate the map.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
