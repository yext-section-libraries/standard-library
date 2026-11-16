import type { StyleGroup } from "./styleSchema.ts";

export type StyleChoice = [string, string];

/** Editor copy is separate from the CSS property names stored in a layout. */
export const controlCopy: Record<string, { label?: string; help: string }> = {
  display: {
    label: "How it sits on the page",
    help: "A block takes its own line. Inline content sits beside text.",
  },
  flexDirection: {
    label: "Order of items",
    help: "Reverse changes the visual order. The page's reading order stays the same.",
  },
  flexWrap: {
    label: "When items run out of room",
    help: "Allow items to continue on another line instead of squeezing into one.",
  },
  gridAutoFlow: {
    label: "Fill order",
    help: "Add items across each row. Fill gaps moves later items into empty spaces; the reading order stays the same.",
  },
  gap: {
    label: "Space between items",
    help: "Adds space between children, without adding space around the outside.",
  },
  rowGap: {
    label: "Space between rows",
    help: "Vertical space between rows of items.",
  },
  columnGap: {
    label: "Space between columns",
    help: "Horizontal space between columns of items.",
  },
  alignItems: {
    help: "Lines up the children across the row or stack. Extra space makes the difference visible.",
  },
  justifyContent: {
    help: "Places items within the space left over inside this element.",
  },
  alignSelf: {
    label: "Align this item",
    help: "Changes this item's alignment without moving its neighbors.",
  },
  flexGrow: {
    label: "Use spare space",
    help: "Lets this item grow when its parent has room left over.",
  },
  flexShrink: {
    label: "When space gets tight",
    help: "Choose whether this item can get smaller to fit.",
  },
  flexBasis: {
    label: "Starting size",
    help: "The item's size before its parent shares out the available space.",
  },
  gridColumn: {
    label: "Columns this item uses",
    help: "Let the grid place it, or let it stretch across several columns.",
  },
  gridRow: {
    label: "Rows this item uses",
    help: "Let the grid place it, or make it span more than one row.",
  },
  width: {
    help: "Sizes this element. Fill parent uses the space available around it.",
  },
  maxWidth: {
    help: "Stops this element getting too wide. It can still be smaller.",
  },
  minWidth: { help: "Stops this element getting too narrow." },
  height: { help: "Auto keeps the height based on the content." },
  minHeight: {
    help: "Reserves at least this much height, while allowing content to make it taller.",
  },
  maxHeight: {
    help: "Limits the height. Choose how extra content behaves below.",
  },
  overflow: {
    label: "Content beyond the edges",
    help: "Choose what happens when content is bigger than its box.",
  },
  aspectRatio: {
    label: "Shape",
    help: "Keeps the width and height in proportion as the element resizes.",
  },
  fontFamily: {
    label: "Font",
    help: "Body and Heading use the fonts set by your theme.",
  },
  fontSize: {
    help: "Changes the size of the text, independently of its heading level.",
  },
  fontWeight: { label: "Weight", help: "How light or bold the text looks." },
  lineHeight: {
    label: "Space between lines",
    help: "More space makes longer passages easier to read.",
  },
  letterSpacing: {
    label: "Space between letters",
    help: "A small adjustment is usually enough.",
  },
  textAlign: { help: "Lines up text inside its available width." },
  textTransform: {
    label: "Capitalization",
    help: "Changes the appearance of the letters without rewriting the text.",
  },
  fontStyle: { label: "Text style", help: "Use normal or italic text." },
  textDecoration: {
    label: "Text decoration",
    help: "Add an underline or a line through the text.",
  },
  textWrap: {
    label: "How lines wrap",
    help: "Balance short headings, or avoid a very short final line in a paragraph.",
  },
  whiteSpace: {
    label: "Spaces and line breaks",
    help: "Choose whether to keep the spaces and line breaks entered in the text.",
  },
  color: {
    help: "Changes text color. Parent follows the surrounding text style.",
  },
  backgroundColor: { help: "The color behind this element's content." },
  backgroundImage: {
    label: "Background image or gradient",
    help: "An optional CSS image or gradient behind the content. Use an Image block for ordinary photos.",
  },
  backgroundSize: {
    label: "Background image fit",
    help: "Fill the area with a crop, or show the whole image.",
  },
  backgroundPosition: {
    label: "Background focal point",
    help: "Choose which part of the image stays in view.",
  },
  backgroundRepeat: {
    label: "Repeat the background",
    help: "Use repeated tiles for patterns and textures.",
  },
  borderColor: { help: "The color of the line around this element." },
  borderWidth: {
    label: "Border thickness",
    help: "A thin border is usually enough to separate content.",
  },
  borderStyle: { help: "Choose the type of line around the element." },
  borderRadius: {
    label: "Corners",
    help: "Round the corners, or leave them square.",
  },
  boxShadow: { label: "Shadow", help: "Adds depth behind the element." },
  opacity: {
    label: "Visibility",
    help: "Makes the whole element, including its content, more see-through.",
  },
  objectFit: {
    label: "Image fit",
    help: "Cropping becomes visible when you set a height or shape under Layout and size.",
  },
  objectPosition: {
    label: "Keep this part in view",
    help: "Choose the focal point when the image is cropped.",
  },
  cursor: {
    label: "Mouse pointer",
    help: "Automatic uses the pointer appropriate for the element.",
  },
  position: {
    label: "Position on the page",
    help: "Normal flow works for most content. Other options let you pin or layer an element.",
  },
  insetBlockStart: {
    label: "Distance from top",
    help: "Offsets the element from the top of its containing area.",
  },
  insetInlineEnd: {
    label: "Distance from right",
    help: "Offsets from the end edge; this follows the page's reading direction.",
  },
  insetBlockEnd: {
    label: "Distance from bottom",
    help: "Offsets the element from the bottom of its containing area.",
  },
  insetInlineStart: {
    label: "Distance from left",
    help: "Offsets from the start edge; this follows the page's reading direction.",
  },
  zIndex: {
    label: "Stacking order",
    help: "Higher numbers bring overlapping elements in front.",
  },
  transform: {
    label: "Move or rotate",
    help: "Adjusts the appearance without moving neighboring elements.",
  },
};

export const preciseChoices: Record<string, StyleChoice[]> = {
  gridAutoFlow: [
    ["Across rows", "row"],
    ["Fill gaps", "dense"],
  ],
  lineHeight: [
    ["Tight", "1.2"],
    ["Regular", "1.5"],
    ["Relaxed", "1.8"],
  ],
  letterSpacing: [
    ["Tight", "-0.02em"],
    ["Normal", "0"],
    ["Wide", "0.08em"],
  ],
  borderWidth: [
    ["None", "0"],
    ["Thin", "1px"],
    ["Medium", "2px"],
    ["Thick", "4px"],
  ],
  opacity: [
    ["Solid", "1"],
    ["75%", "0.75"],
    ["50%", "0.5"],
    ["25%", "0.25"],
  ],
  overflow: [
    ["Show it", "visible"],
    ["Crop it", "hidden"],
    ["Scroll if needed", "auto"],
  ],
  zIndex: [
    ["Automatic", "auto"],
    ["Above", "10"],
    ["Overlay", "100"],
    ["On top", "1000"],
  ],
  transform: [
    ["None", "none"],
    ["Tilt left", "rotate(-5deg)"],
    ["Tilt right", "rotate(5deg)"],
    ["Smaller", "scale(0.95)"],
    ["Larger", "scale(1.05)"],
  ],
  position: [
    ["Normal flow", "static"],
    ["Small offset", "relative"],
    ["Over other content", "absolute"],
    ["Stick on scroll", "sticky"],
    ["Fixed to screen", "fixed"],
  ],
  whiteSpace: [
    ["Normal", "normal"],
    ["Keep line breaks", "pre-line"],
    ["Keep spaces too", "pre-wrap"],
  ],
  textWrap: [
    ["Normal", "wrap"],
    ["Balanced heading", "balance"],
    ["Neater paragraph", "pretty"],
    ["One line", "nowrap"],
  ],
  flexGrow: [
    ["Natural size", "0"],
    ["Fill spare space", "1"],
  ],
  flexShrink: [
    ["Can get smaller", "1"],
    ["Keep its size", "0"],
  ],
  flexBasis: [
    ["Automatic", "auto"],
    ["Fit content", "content"],
    ["Half the space", "50%"],
  ],
};
export const focalPoints: StyleChoice[] = [
  ["Top left", "left top"],
  ["Top", "top"],
  ["Top right", "right top"],
  ["Left", "left"],
  ["Center", "center"],
  ["Right", "right"],
  ["Bottom left", "left bottom"],
  ["Bottom", "bottom"],
  ["Bottom right", "right bottom"],
];

export const detailGroups: Record<
  StyleGroup,
  { title: string; help: string; properties: string[] }[]
> = {
  layout: [
    {
      title: "Grid details",
      help: "Fine-tune how the grid fills and the space between its rows and columns.",
      properties: [
        "gridAutoFlow",
        "rowGap",
        "columnGap",
        "alignItems",
        "justifyContent",
      ],
    },
    {
      title: "Size limits",
      help: "Keep content within a comfortable size as the screen changes.",
      properties: [
        "minWidth",
        "minHeight",
        "maxHeight",
        "aspectRatio",
        "height",
      ],
    },
    {
      title: "Extra content",
      help: "Decide what happens when content does not fit.",
      properties: ["overflow"],
    },
    {
      title: "Display and order",
      help: "Optional alternatives to the main arrangement buttons.",
      properties: ["display", "flexDirection", "flexWrap"],
    },
    {
      title: "Inside the parent",
      help: "Adjust how this item fits into its surrounding layout.",
      properties: [
        "alignSelf",
        "flexGrow",
        "flexShrink",
        "flexBasis",
        "gridColumn",
        "gridRow",
      ],
    },
  ],
  spacing: [],
  typography: [
    {
      title: "Reading comfort",
      help: "Small adjustments to make text easier to read.",
      properties: ["lineHeight", "letterSpacing", "textWrap", "whiteSpace"],
    },
    {
      title: "Text appearance",
      help: "Optional changes to capitalization and decoration.",
      properties: ["textTransform", "fontStyle", "textDecoration", "textAlign"],
    },
  ],
  surface: [
    {
      title: "Background and shadow",
      help: "A background behind the image, or a shadow around its edges.",
      properties: ["backgroundColor", "boxShadow"],
    },
    {
      title: "Background artwork",
      help: "For decorative images, gradients, and repeating patterns.",
      properties: [
        "backgroundImage",
        "backgroundSize",
        "backgroundPosition",
        "backgroundRepeat",
      ],
    },
    {
      title: "Border details",
      help: "Fine-tune the line around this element.",
      properties: ["borderColor", "borderWidth", "borderStyle"],
    },
    {
      title: "Visibility and image details",
      help: "Adjust transparency, cropping, and the mouse pointer.",
      properties: ["opacity", "objectFit", "objectPosition", "cursor"],
    },
  ],
  position: [
    {
      title: "Positioning",
      help: "Most content should stay in normal flow.",
      properties: ["position"],
    },
    {
      title: "Offsets",
      help: "Set the distance from the edges of the containing area.",
      properties: [
        "insetBlockStart",
        "insetInlineEnd",
        "insetBlockEnd",
        "insetInlineStart",
      ],
    },
    {
      title: "Layers and adjustments",
      help: "Bring overlapping elements forward, or make a small visual adjustment.",
      properties: ["zIndex", "transform"],
    },
  ],
};
