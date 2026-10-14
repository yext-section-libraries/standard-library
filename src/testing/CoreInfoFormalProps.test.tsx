import { coreInfoSectionSchema } from "../library/shared/formalProps/coreInfo.ts";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { resolveComponentData } from "@yext/visual-editor";
import {
  CoreInfoSection,
  config as coreInfoConfig,
} from "../library/sections/CoreInfoSection.tsx";
import { config as addressConfig } from "../library/sections/Address.tsx";
import { config as hoursTableConfig } from "../library/sections/HoursTable.tsx";
import { config as emailsConfig } from "../library/sections/Emails.tsx";
import { config as textListConfig } from "../library/sections/TextList.tsx";
import {
  addressSchema,
  emailsSchema,
  hoursTableSchema,
  textListSchema,
  headingTextSchema,
  phoneListSchema,
  hoursStatusSchema,
} from "../library/shared/formalProps/slots.ts";

const coreInfoProps = () => {
  const props = structuredClone({ ...CoreInfoSection.defaultProps });
  props.slots!.CoreInfoAddressSlot[0].props.data.address = {
    field: "address",
    constantValue: {},
    constantValueEnabled: false,
  };
  props.slots!.HoursTableSlot[0].props.data.hours.constantValueEnabled = false;
  for (const phone of props.slots!.CoreInfoPhoneNumbersSlot[0].props.data
    .phoneNumbers) {
    phone.number.constantValueEnabled = false;
  }
  return props;
};

describe("Core Info formal props", () => {
  it("validates entity-bound props and exposes schemas through section configs", () => {
    expect(coreInfoSectionSchema.safeParse(coreInfoProps()).success).toBe(true);
    for (const [config, schema] of [
      [coreInfoConfig, coreInfoSectionSchema],
      [addressConfig, addressSchema],
      [hoursTableConfig, hoursTableSchema],
      [emailsConfig, emailsSchema],
      [textListConfig, textListSchema],
    ] as const) {
      expect(config.formalProps).toBe(schema);
      expect(() => z.toJSONSchema(schema)).not.toThrow();
    }
  });

  it("validates every entity-bound slot independently", () => {
    const slots = coreInfoProps().slots!;
    for (const [schema, slot] of [
      [headingTextSchema, slots.CoreInfoHeadingSlot],
      [addressSchema, slots.CoreInfoAddressSlot],
      [phoneListSchema, slots.CoreInfoPhoneNumbersSlot],
      [emailsSchema, slots.CoreInfoEmailsSlot],
      [headingTextSchema, slots.HoursHeadingSlot],
      [hoursTableSchema, slots.HoursTableSlot],
      [headingTextSchema, slots.ServicesHeadingSlot],
      [textListSchema, slots.TextListSlot],
    ] as const) {
      expect(schema.safeParse(slot[0].props).success).toBe(true);
    }
  });

  it.each([
    [
      addressSchema.shape.data.shape.address,
      "address",
      {},
      { line1: "123 Main St", city: "New York" },
    ],
    [
      hoursTableSchema.shape.data.shape.hours,
      "hours",
      {},
      { monday: { isClosed: true } },
    ],
    [
      hoursStatusSchema.shape.data.shape.hours,
      "hours",
      {},
      { monday: { isClosed: true } },
    ],
    [
      phoneListSchema.shape.data.shape.phoneNumbers.element.shape.number,
      "mainPhone",
      "",
      "+12125551234",
    ],
  ] as const)(
    "requires empty constants and resolves entity data for %s",
    (schema, field, constantValue, entityValue) => {
      const reference = { field, constantValue, constantValueEnabled: false };
      expect(schema.parse(reference)).toEqual(reference);
      expect(
        resolveComponentData(reference, "en", { [field]: entityValue })
      ).toEqual(entityValue);
      for (const invalid of [
        { ...reference, constantValue: entityValue },
        { ...reference, constantValueEnabled: true },
        { ...reference, field: "" },
        { field, constantValue },
        { field, constantValueEnabled: false },
        { ...reference, unexpected: "value" },
      ]) {
        expect(schema.safeParse(invalid).success).toBe(false);
      }
      const jsonSchema = z.toJSONSchema(schema);
      expect(jsonSchema.required).toEqual([
        "field",
        "constantValue",
        "constantValueEnabled",
      ]);
      expect(jsonSchema.properties?.constantValueEnabled).toMatchObject({
        const: false,
      });
    }
  );

  it("rejects invented constants inside Core Info slots", () => {
    const props = coreInfoProps();
    props.slots!.CoreInfoAddressSlot[0].props.data.address.constantValue = {
      line1: "Invented",
    };
    expect(coreInfoSectionSchema.safeParse(props).success).toBe(false);
  });

  it("requires every Core Info slot to be present and populated", () => {
    const props = coreInfoSectionSchema.parse(coreInfoProps());
    for (const slotName of Object.keys(props.slots)) {
      const slots: Record<string, unknown> = { ...props.slots };
      slots[slotName] = [];
      expect(coreInfoSectionSchema.safeParse({ ...props, slots }).success).toBe(
        false
      );
      delete slots[slotName];
      expect(coreInfoSectionSchema.safeParse({ ...props, slots }).success).toBe(
        false
      );
    }
    const jsonSchema = z.toJSONSchema(coreInfoSectionSchema.shape.slots);
    expect(jsonSchema.required).toEqual(Object.keys(props.slots));
    for (const slot of Object.values(jsonSchema.properties!)) {
      expect(slot).toMatchObject({ minItems: 1 });
    }
  });

  it("accepts populated hidden slots with no data", () => {
    const props = coreInfoSectionSchema.parse(coreInfoProps());
    props.liveVisibility = false;
    props.conditionalRender = {
      coreInfoCol: false,
      hoursCol: false,
      servicesCol: false,
    };
    props.slots.CoreInfoPhoneNumbersSlot[0].props.data.phoneNumbers = [];
    props.slots.CoreInfoEmailsSlot[0].props.data.list.constantValue = [];
    props.slots.TextListSlot[0].props.list.constantValue = [];
    expect(coreInfoSectionSchema.safeParse(props).success).toBe(true);
  });

  it("rejects incorrect types or hours options", () => {
    const wrongType = coreInfoProps();
    wrongType.slots!.CoreInfoAddressSlot[0].type = "HoursTableSlot";
    expect(coreInfoSectionSchema.safeParse(wrongType).success).toBe(false);
    const wrongHours = coreInfoProps();
    wrongHours.slots!.HoursTableSlot[0].props.styles.startOfWeek = "invalid";
    expect(coreInfoSectionSchema.safeParse(wrongHours).success).toBe(false);
  });
});
