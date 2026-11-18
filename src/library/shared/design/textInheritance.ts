/** Original values used by the historical text-inheritance migration. */
export const bodyTextDefaults = {
  fontFamily: "var(--fontFamily-body-fontFamily, sans-serif)",
  fontWeight: "var(--fontWeight-body-fontWeight, 400)",
  fontSize: "var(--fontSize-body-fontSize, 1rem)",
  lineHeight: "1.6",
  textWrap: "pretty",
};

export function inheritParagraphDefaults<
  Props extends { id: string } & Record<string, any>,
>(props: Props): Props {
  const typography = { ...props.typography };
  for (const [property, value] of Object.entries(bodyTextDefaults))
    if (typography[property] === value) delete typography[property];
  return { ...props, typography };
}
