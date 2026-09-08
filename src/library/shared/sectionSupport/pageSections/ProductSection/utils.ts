import { formatCurrency, ProductPrice } from "@yext/visual-editor";

/**
 * Returns true when a price includes a value and currency code and can be
 * correctly formatted.
 */
export const isCompleteProductPrice = (
  value: unknown,
  locale: string
): value is NonNullable<ProductPrice> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const price = value as Partial<NonNullable<ProductPrice>>;
  return (
    ("value" in price || "currencyCode" in price) &&
    formatCurrency(price.value, price.currencyCode, locale) !== undefined
  );
};

/**
 * Returns true when a value looks like a product price object but cannot be
 * formatted into a display string.
 */
export const isInvalidProductPrice = (value: unknown, locale: string) => {
  return (
    typeof value === "object" &&
    value !== null &&
    ("value" in value || "currencyCode" in value) &&
    !isCompleteProductPrice(value, locale)
  );
};
