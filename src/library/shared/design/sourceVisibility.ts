import {
  resolveYextEntityField,
  type StreamDocument,
  type YextEntityField,
} from "@yext/visual-editor";

/** Check source data before rendering, so mapped-empty sections also disappear in server HTML. */
export function mappedSourcesAreEmpty(
  content: unknown,
  document: StreamDocument
): boolean {
  const empty: boolean[] = [];
  const inspect = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(inspect);
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, any>;
    if (typeof node.type === "string" && node.props) {
      if (node.type === "Reviews") {
        const providers = document.ref_reviewsAgg;
        const reviews = Array.isArray(providers)
          ? providers.find((provider) => provider.publisher === "FIRSTPARTY")
              ?.topReviews
          : undefined;
        empty.push(!Array.isArray(reviews) || reviews.length === 0);
      }
      const source =
        node.type === "Collection"
          ? node.props.items
          : node.type === "Gallery" || node.type === "PhotoGalleryWrapper"
            ? node.props.data?.images
            : node.type === "FAQCollection" ||
                node.type.endsWith("CardsWrapper")
              ? node.props.data
              : undefined;
      if (source?.field && !source.constantValueEnabled) {
        const items = resolveYextEntityField(
          document,
          source as YextEntityField<unknown[]>,
          document.locale ?? "en"
        );
        empty.push(!Array.isArray(items) || !items.length);
      }
    }
    Object.values(node).forEach(inspect);
  };
  inspect(content);
  return empty.length > 0 && empty.every(Boolean);
}
