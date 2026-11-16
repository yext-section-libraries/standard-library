import type { SectionLibraryVisualEditorProvider } from "@yext/visual-editor/section-library-support";
type StreamFields = NonNullable<
  Parameters<typeof SectionLibraryVisualEditorProvider>[0]["entityFields"]
>;

/** Local sample schema and document. The platform supplies these from the selected entity. */
export const demoDocument = {
  locale: "en",
  name: "Fieldwork Studio",
  c_headline: "Make room for your next idea.",
  description: "Flexible workspaces for independent minds and growing teams.",
  mainPhone: "+12125550123",
  websiteUrl: "https://example.com",
  address: {
    line1: "100 Example Street",
    city: "New York",
    region: "NY",
    postalCode: "10001",
    countryCode: "US",
  },
  c_offers: [
    {
      title: "Day desk",
      description: "A fresh perspective whenever you need one.",
    },
    { title: "Team room", description: "Private space with room to grow." },
  ],
};
const stringField = (name: string, displayName: string) => ({
  name,
  displayName,
  definition: { name, typeName: "type.string", type: {} },
});
export const demoEntityFields: StreamFields = {
  fields: [
    stringField("name", "Name"),
    stringField("c_headline", "Headline"),
    stringField("description", "Description"),
    {
      name: "mainPhone",
      displayName: "Main phone",
      definition: { name: "mainPhone", typeName: "type.phone", type: {} },
    },
    {
      name: "websiteUrl",
      displayName: "Website",
      definition: { name: "websiteUrl", typeName: "type.url", type: {} },
    },
    {
      name: "address",
      displayName: "Address",
      definition: { name: "address", typeName: "type.address", type: {} },
      children: {
        fields: [
          stringField("line1", "Street"),
          stringField("city", "City"),
          stringField("region", "Region"),
          stringField("postalCode", "Postal code"),
          stringField("countryCode", "Country code"),
        ],
      },
    },
    {
      name: "c_offers",
      displayName: "Offers",
      definition: {
        name: "c_offers",
        typeName: "c_offer",
        isList: true,
        type: {},
      },
      children: {
        fields: [
          stringField("title", "Title"),
          stringField("description", "Description"),
        ],
      },
    },
  ],
  displayNames: {
    name: "Name",
    c_headline: "Headline",
    description: "Description",
    mainPhone: "Main phone",
    websiteUrl: "Website",
    address: "Address",
    c_offers: "Offers",
    "c_offers.title": "Offers > Title",
    "c_offers.description": "Offers > Description",
  },
};
