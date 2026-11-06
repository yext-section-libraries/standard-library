import type { Slot } from "@puckeditor/core";
import type { Migration } from "@yext/visual-editor";

// Deduplicate header ids, which matches the updated slot handling, in order to support layout generation
export const headerMenuIds: Migration = {
  ExpandedHeader: {
    action: "updated",
    propTransformation: (props) => {
      const migratedProps = structuredClone(props);
      const primary = migratedProps.slots?.PrimaryHeaderSlot?.[0];
      const menuHeaders = primary?.props.parentValues?.SecondaryHeaderSlot;

      menuHeaders?.forEach((menuHeader: Slot[number], headerIndex: number) => {
        const inlineHeader = props.slots?.SecondaryHeaderSlot?.[headerIndex];
        if (!inlineHeader) {
          return;
        }

        const headerId =
          inlineHeader.props.id ?? `${props.id}-secondary-${headerIndex}`;
        menuHeader.props.id = `${headerId}-menu`;
        menuHeader.props.slots?.LinksSlot?.forEach(
          (menuLinks: Slot[number], linksIndex: number) => {
            const linksId =
              inlineHeader.props.slots?.LinksSlot?.[linksIndex]?.props.id ??
              `${headerId}-links-${linksIndex}`;
            menuLinks.props.id = `${linksId}-menu`;
          }
        );
      });

      return migratedProps;
    },
  },
};
