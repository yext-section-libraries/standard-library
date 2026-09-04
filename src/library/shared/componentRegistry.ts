import type { Config } from "@puckeditor/core";
import { HeadingText as SharedComponent0 } from "../sections/HeadingText";
import { Breadcrumbs as SharedComponent1 } from "../sections/Breadcrumbs";
import { DirectoryGrid as SharedComponent2 } from "./sectionSupport/directory/DirectoryWrapper";
import { DirectoryCard as SharedComponent3 } from "./sectionSupport/directory/DirectoryCard";
import { Address as SharedComponent4 } from "../sections/Address";
import { HoursStatus as SharedComponent5 } from "../sections/HoursStatus";
import { Phone as SharedComponent6 } from "../sections/Phone";
import { PrimaryHeaderSlot as SharedComponent7 } from "./sectionSupport/header/PrimaryHeaderSlot";
import { ImageWrapper as SharedComponent8 } from "../sections/ImageWrapper";
import { HeaderLinks as SharedComponent9 } from "./sectionSupport/header/HeaderLinks";
import { CTAWrapper as SharedComponent10 } from "../sections/CTAWrapper";
import { SecondaryHeaderSlot as SharedComponent11 } from "./sectionSupport/header/SecondaryHeaderSlot";
import { FooterLogoSlot as SharedComponent12 } from "./sectionSupport/footer/FooterLogoSlot";
import { FooterSocialLinksSlot as SharedComponent13 } from "./sectionSupport/footer/FooterSocialLinksSlot";
import { FooterUtilityImagesSlot as SharedComponent14 } from "./sectionSupport/footer/FooterUtilityImagesSlot";
import { FooterLinksSlot as SharedComponent15 } from "./sectionSupport/footer/FooterLinksSlot";
import { FooterExpandedLinksWrapper as SharedComponent16 } from "./sectionSupport/footer/FooterExpandedLinksWrapper";
import { SecondaryFooterSlot as SharedComponent17 } from "./sectionSupport/footer/SecondaryFooterSlot";
import { CopyrightMessageSlot as SharedComponent18 } from "./sectionSupport/footer/CopyrightMessageSlot";
import { Video as SharedComponent19 } from "./sectionSupport/contentBlocks/Video";
import { ProductCardsWrapper as SharedComponent20 } from "./sectionSupport/pageSections/ProductSection/ProductCardsWrapper";
import { ProductCard as SharedComponent21 } from "./sectionSupport/pageSections/ProductSection/ProductCard";
import { TestimonialCardsWrapper as SharedComponent22 } from "./sectionSupport/pageSections/TestimonialSection/TestimonialCardsWrapper";
import { TestimonialCard as SharedComponent23 } from "./sectionSupport/pageSections/TestimonialSection/TestimonialCard";
import { FAQCard as SharedComponent24 } from "./sectionSupport/pageSections/FAQsSection/FAQCard";
import { TeamCard as SharedComponent25 } from "./sectionSupport/pageSections/TeamSection/TeamCard";
import { TeamCardsWrapper as SharedComponent26 } from "./sectionSupport/pageSections/TeamSection/TeamCardsWrapper";
import { InsightCardsWrapper as SharedComponent27 } from "./sectionSupport/pageSections/InsightSection/InsightCardsWrapper";
import { InsightCard as SharedComponent28 } from "./sectionSupport/pageSections/InsightSection/InsightCard";
import { PhotoGalleryWrapper as SharedComponent29 } from "./sectionSupport/pageSections/PhotoGallerySection/PhotoGalleryWrapper";
import { NearbyLocationCardsWrapper as SharedComponent30 } from "./sectionSupport/pageSections/NearbyLocations/NearbyLocationsCardsWrapper";
import { HeroImage as SharedComponent31 } from "./sectionSupport/contentBlocks/image/HeroImage";
import { PhoneList as SharedComponent32 } from "./sectionSupport/contentBlocks/PhoneList";
import { Emails as SharedComponent33 } from "../sections/Emails";
import { HoursTable as SharedComponent34 } from "../sections/HoursTable";
import { TextList as SharedComponent35 } from "../sections/TextList";
import { BodyText as SharedComponent36 } from "../sections/BodyText";
import { Text as SharedComponent37 } from "../sections/Text";
import { FAQsSection as SharedComponent38 } from "../sections/FAQsSection";
import { EventCardsWrapper as SharedComponent39 } from "./sectionSupport/pageSections/EventSection/EventCardsWrapper";
import { EventCard as SharedComponent40 } from "./sectionSupport/pageSections/EventSection/EventCard";
import { Timestamp as SharedComponent41 } from "./sectionSupport/contentBlocks/Timestamp";
import {
  directoryRootConfig,
  locatorRootConfig,
  rootAllowedComponents,
} from "./roots";

/** Hidden internal Puck components referenced by saved Directory layout data. */
export const sharedComponentMetadata = [
  { id: "HeadingTextSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "BreadcrumbsSlot", pageSetTypes: ["DIRECTORY"] },
  { id: "DirectoryGrid", pageSetTypes: ["DIRECTORY"] },
  { id: "DirectoryCard", pageSetTypes: ["DIRECTORY"] },
  { id: "AddressSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "HoursStatusSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "PhoneSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "PrimaryHeaderSlot", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  { id: "ImageSlot", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  { id: "HeaderLinks", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  { id: "CTASlot", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  {
    id: "SecondaryHeaderSlot",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  { id: "FooterLogoSlot", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  {
    id: "FooterSocialLinksSlot",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  {
    id: "FooterUtilityImagesSlot",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  { id: "FooterLinksSlot", pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"] },
  {
    id: "FooterExpandedLinksWrapper",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  {
    id: "SecondaryFooterSlot",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  {
    id: "CopyrightMessageSlot",
    pageSetTypes: ["ENTITY", "DIRECTORY", "LOCATOR"],
  },
  { id: "VideoSlot", pageSetTypes: ["ENTITY"] },
  { id: "ProductCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "ProductCard", pageSetTypes: ["ENTITY"] },
  { id: "TestimonialCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "TestimonialCard", pageSetTypes: ["ENTITY"] },
  { id: "FAQCard", pageSetTypes: ["ENTITY"] },
  { id: "TeamCard", pageSetTypes: ["ENTITY"] },
  { id: "TeamCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "InsightCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "InsightCard", pageSetTypes: ["ENTITY"] },
  { id: "PhotoGalleryWrapper", pageSetTypes: ["ENTITY"] },
  { id: "NearbyLocationCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "HeroImageSlot", pageSetTypes: ["ENTITY"] },
  { id: "PhoneNumbersSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "EmailsSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "HoursTableSlot", pageSetTypes: ["ENTITY", "DIRECTORY"] },
  { id: "TextListSlot", pageSetTypes: ["ENTITY"] },
  { id: "BodyTextSlot", pageSetTypes: ["ENTITY"] },
  { id: "TextSlot", pageSetTypes: ["ENTITY"] },
  { id: "FAQSection", pageSetTypes: ["ENTITY"] },
  { id: "EventCardsWrapper", pageSetTypes: ["ENTITY"] },
  { id: "EventCard", pageSetTypes: ["ENTITY"] },
  { id: "Timestamp", pageSetTypes: ["ENTITY"] },
] as const;

/** Puck configs for the hidden internal components. */
export const sharedComponentConfigs: Record<
  string,
  Config["components"][string]
> = {
  HeadingTextSlot: SharedComponent0,
  BreadcrumbsSlot: SharedComponent1,
  DirectoryGrid: SharedComponent2,
  DirectoryCard: SharedComponent3,
  AddressSlot: SharedComponent4,
  HoursStatusSlot: SharedComponent5,
  PhoneSlot: SharedComponent6,
  PrimaryHeaderSlot: SharedComponent7,
  ImageSlot: SharedComponent8,
  HeaderLinks: SharedComponent9,
  CTASlot: SharedComponent10,
  SecondaryHeaderSlot: SharedComponent11,
  FooterLogoSlot: SharedComponent12,
  FooterSocialLinksSlot: SharedComponent13,
  FooterUtilityImagesSlot: SharedComponent14,
  FooterLinksSlot: SharedComponent15,
  FooterExpandedLinksWrapper: SharedComponent16,
  SecondaryFooterSlot: SharedComponent17,
  CopyrightMessageSlot: SharedComponent18,
  VideoSlot: SharedComponent19,
  ProductCardsWrapper: SharedComponent20,
  ProductCard: SharedComponent21,
  TestimonialCardsWrapper: SharedComponent22,
  TestimonialCard: SharedComponent23,
  FAQCard: SharedComponent24,
  TeamCard: SharedComponent25,
  TeamCardsWrapper: SharedComponent26,
  InsightCardsWrapper: SharedComponent27,
  InsightCard: SharedComponent28,
  PhotoGalleryWrapper: SharedComponent29,
  NearbyLocationCardsWrapper: SharedComponent30,
  HeroImageSlot: SharedComponent31,
  PhoneNumbersSlot: SharedComponent32,
  EmailsSlot: SharedComponent33,
  HoursTableSlot: SharedComponent34,
  TextListSlot: SharedComponent35,
  BodyTextSlot: SharedComponent36,
  TextSlot: SharedComponent37,
  FAQSection: SharedComponent38,
  EventCardsWrapper: SharedComponent39,
  EventCard: SharedComponent40,
  Timestamp: SharedComponent41,
};

export const sharedRootConfigs: Partial<
  Record<string, NonNullable<Config["root"]>>
> = {
  DIRECTORY: directoryRootConfig,
  LOCATOR: locatorRootConfig,
};

export const sharedRootPageSetTypes = ["DIRECTORY", "LOCATOR"] as const;

export const sharedRootAllowedComponentIds: Partial<Record<string, string[]>> =
  {
    DIRECTORY: rootAllowedComponents,
    LOCATOR: rootAllowedComponents,
  };
