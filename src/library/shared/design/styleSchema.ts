/** Shared by the editor controls and the CSS compiler. Empty values use the component's styles. */
export const styleSchema = {
  layout: {
    display: [
      "Display",
      "",
      "block",
      "flex",
      "grid",
      "inline-flex",
      "inline-block",
      "none",
    ],
    flexDirection: [
      "Direction",
      "",
      "row",
      "column",
      "row-reverse",
      "column-reverse",
    ],
    flexWrap: ["Wrap", "", "wrap", "nowrap"],
    alignItems: [
      "Align items",
      "",
      "stretch",
      "start",
      "center",
      "end",
      "baseline",
    ],
    justifyContent: [
      "Distribute items",
      "",
      "start",
      "center",
      "end",
      "space-between",
      "space-around",
      "space-evenly",
    ],
    gridTemplateColumns: ["Grid columns", "columns"],
    gridAutoFlow: ["Grid flow", "", "row", "column", "dense"],
    gap: ["Gap", "space"],
    rowGap: ["Row gap", "space"],
    columnGap: ["Column gap", "space"],
    alignSelf: [
      "Align in parent",
      "",
      "auto",
      "stretch",
      "start",
      "center",
      "end",
    ],
    flexGrow: ["Grow in parent", "", "0", "1"],
    flexShrink: ["Shrink in parent", "", "0", "1"],
    flexBasis: ["Basis in parent", "size"],
    gridColumn: ["Column span / placement", "value"],
    gridRow: ["Row span / placement", "value"],
    width: ["Width", "size"],
    maxWidth: ["Maximum width", "size"],
    minWidth: ["Minimum width", "size"],
    height: ["Height", "size"],
    minHeight: ["Minimum height", "size"],
    maxHeight: ["Maximum height", "size"],
    aspectRatio: ["Aspect ratio", "value"],
    overflow: ["Overflow", "", "visible", "hidden", "clip", "auto"],
  },
  spacing: {
    paddingBlockStart: ["Padding top", "space"],
    paddingInlineEnd: ["Padding end", "space"],
    paddingBlockEnd: ["Padding bottom", "space"],
    paddingInlineStart: ["Padding start", "space"],
    marginBlockStart: ["Margin top", "space"],
    marginInlineEnd: ["Margin end", "space"],
    marginBlockEnd: ["Margin bottom", "space"],
    marginInlineStart: ["Margin start", "space"],
  },
  typography: {
    fontFamily: ["Font family", "font"],
    fontSize: ["Font size", "fontSize"],
    fontWeight: ["Weight", "weight"],
    lineHeight: ["Line height", "value"],
    letterSpacing: ["Letter spacing", "space"],
    textAlign: ["Alignment", "", "start", "center", "end", "justify"],
    textTransform: ["Case", "", "none", "uppercase", "lowercase", "capitalize"],
    fontStyle: ["Font style", "", "normal", "italic"],
    textDecoration: ["Decoration", "", "none", "underline", "line-through"],
    textWrap: ["Text wrapping", "", "wrap", "balance", "pretty", "nowrap"],
    whiteSpace: ["Whitespace", "", "normal", "pre-line", "pre-wrap"],
    color: ["Text color", "color"],
  },
  surface: {
    backgroundColor: ["Background color", "color"],
    backgroundImage: ["Background image or gradient", "value"],
    backgroundSize: ["Background size", "", "cover", "contain", "auto"],
    backgroundPosition: ["Background position", "value"],
    backgroundRepeat: ["Background repeat", "", "no-repeat", "repeat"],
    borderColor: ["Border color", "color"],
    borderWidth: ["Border width", "space"],
    borderStyle: ["Border style", "", "none", "solid", "dashed", "dotted"],
    borderRadius: ["Corner radius", "space"],
    boxShadow: ["Shadow", "shadow"],
    opacity: ["Opacity (0–1)", "value"],
    objectFit: [
      "Image fit",
      "",
      "cover",
      "contain",
      "fill",
      "none",
      "scale-down",
    ],
    objectPosition: ["Image focal point", "value"],
    cursor: ["Cursor", "", "auto", "pointer"],
  },
  position: {
    position: [
      "Position",
      "",
      "static",
      "relative",
      "absolute",
      "sticky",
      "fixed",
    ],
    insetBlockStart: ["Top offset", "space"],
    insetInlineEnd: ["End offset", "space"],
    insetBlockEnd: ["Bottom offset", "space"],
    insetInlineStart: ["Start offset", "space"],
    zIndex: ["Layer", "value"],
    transform: ["Transform", "value"],
  },
} as const;

export type StyleGroup = keyof typeof styleSchema;
export type StyleGroups = {
  [Group in StyleGroup]?: Partial<
    Record<keyof (typeof styleSchema)[Group], string>
  >;
};

export type DesignProps = StyleGroups & {
  responsive?: { tablet?: StyleGroups; mobile?: StyleGroups };
  states?: {
    hover?: StyleGroups;
    focusVisible?: StyleGroups;
    active?: StyleGroups;
  };
  attributes?: {
    htmlId?: string;
    ariaLabel?: string;
    title?: string;
    language?: string;
    direction?: "" | "ltr" | "rtl";
  };
};

export const styleGroupLabels: Record<StyleGroup, string> = {
  layout: "Layout and size",
  spacing: "Spacing",
  typography: "Typography",
  surface: "Background, border and image",
  position: "Position",
};

export const themeSectionSpacing: [string, string] = [
  "Theme section spacing",
  "var(--ve-page-section-vertical-spacing)",
];

export const valueSuggestions: Record<string, [string, string][]> = {
  space: [
    ["None", "0"],
    ["Auto", "auto"],
    ["Extra small", "var(--space-2, 0.5rem)"],
    ["Small", "var(--space-4, 1rem)"],
    ["Medium", "var(--space-6, 1.5rem)"],
    ["Large", "var(--space-8, 2rem)"],
    ["Extra large", "var(--space-12, 3rem)"],
    themeSectionSpacing,
  ],
  size: [
    ["Auto", "auto"],
    ["Full width", "100%"],
    ["Fit content", "fit-content"],
    ["Reading width", "65ch"],
    ["Page width", "var(--ve-page-content-max-width)"],
    ["Viewport height", "100svh"],
    ["No minimum", "0"],
  ],
  shadow: [
    ["None", "none"],
    ["Small", "var(--shadow-sm, 0 1px 3px #0000001a)"],
    ["Medium", "var(--shadow-md, 0 8px 24px #00000014)"],
  ],
  columns: [
    ["One column", "minmax(0, 1fr)"],
    ["Two equal columns", "repeat(2, minmax(0, 1fr))"],
    ["Three equal columns", "repeat(3, minmax(0, 1fr))"],
    ["Four equal columns", "repeat(4, minmax(0, 1fr))"],
    ["Wide left column", "minmax(0, 2fr) minmax(0, 1fr)"],
    ["Wide right column", "minmax(0, 1fr) minmax(0, 2fr)"],
    ["Auto fit cards", "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))"],
  ],
  value: [],
};
