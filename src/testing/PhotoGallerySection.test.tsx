import React from "react";
import { VisualEditorProvider } from "./TestVisualEditorProvider.tsx";
import { describe, it, expect } from "vitest";
import {
  axe,
  ComponentTest,
  transformTests,
  viewports,
} from "./componentTests.setup.ts";
import {
  render as reactRender,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import { PhotoGallerySection } from "../library/sections/PhotoGallerySection.tsx";
import {
  migrate,
  MainContent,
  migrationRegistry,
  toPuckFields,
  type StreamDocument,
} from "@yext/visual-editor";
import { sharedComponentConfigs } from "../library/shared/componentRegistry.ts";
import {
  Render,
  Config,
  Puck,
  resolveAllData,
  useGetPuck,
} from "@puckeditor/core";
import { PhotoGalleryWrapper } from "../library/shared/sectionSupport/pageSections/PhotoGallerySection/PhotoGalleryWrapper.tsx";
import { photoGallerySource } from "../library/shared/sectionSupport/pageSections/PhotoGallerySection/photoGallerySource.ts";
import { page } from "@vitest/browser/context";

const photoGalleryData = [
  {
    image: {
      height: 2048,
      thumbnails: [
        {
          height: 2048,
          url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/2048x2048.jpg",
          width: 2048,
        },
        {
          height: 1900,
          url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/1900x1900.jpg",
          width: 1900,
        },
        {
          height: 619,
          url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/619x619.jpg",
          width: 619,
        },
        {
          height: 450,
          url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/450x450.jpg",
          width: 450,
        },
        {
          height: 196,
          url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/196x196.jpg",
          width: 196,
        },
      ],
      url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/2048x2048.jpg",
      width: 2048,
    },
  },
  {
    image: {
      height: 2048,
      thumbnails: [
        {
          height: 2048,
          url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/2048x2048.jpg",
          width: 2048,
        },
        {
          height: 1900,
          url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/1900x1900.jpg",
          width: 1900,
        },
        {
          height: 619,
          url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/619x619.jpg",
          width: 619,
        },
        {
          height: 450,
          url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/450x450.jpg",
          width: 450,
        },
        {
          height: 196,
          url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/196x196.jpg",
          width: 196,
        },
      ],
      url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/2048x2048.jpg",
      width: 2048,
    },
  },
  {
    image: {
      height: 2048,
      thumbnails: [
        {
          height: 2048,
          url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/2048x2048.jpg",
          width: 2048,
        },
        {
          height: 1900,
          url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/1900x1900.jpg",
          width: 1900,
        },
        {
          height: 619,
          url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/619x619.jpg",
          width: 619,
        },
        {
          height: 450,
          url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/450x450.jpg",
          width: 450,
        },
        {
          height: 196,
          url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/196x196.jpg",
          width: 196,
        },
      ],
      url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/2048x2048.jpg",
      width: 2048,
    },
  },
  {
    image: {
      height: 2048,
      thumbnails: [
        {
          height: 2048,
          url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/2048x2048.jpg",
          width: 2048,
        },
        {
          height: 1900,
          url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/1900x1900.jpg",
          width: 1900,
        },
        {
          height: 619,
          url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/619x619.jpg",
          width: 619,
        },
        {
          height: 450,
          url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/450x450.jpg",
          width: 450,
        },
        {
          height: 196,
          url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/196x196.jpg",
          width: 196,
        },
      ],
      url: "https://a.mktgcdn.com/p-dev/9sn-xdC6lJIbOEIj0bZBZhaM5EM963H1Rv044oszkgs/2048x2048.jpg",
      width: 2048,
    },
  },
];

const tests: ComponentTest[] = [
  {
    name: "default props with empty document",
    document: {},
    props: { ...PhotoGallerySection.defaultProps },
    version: migrationRegistry.length,
  },
  {
    name: "default props with document data",
    document: { photoGallery: photoGalleryData },
    props: { ...PhotoGallerySection.defaultProps },
    version: migrationRegistry.length,
  },
  {
    name: "version 53 gallery variant with mixed locale images",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "gallery",
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3c58d37f-7f1d-46ad-8938-e72ac3013b39",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    en: "Gallery",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-96ee4ed8-d5f7-451a-ac90-8657c4526c42",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        es: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 1,
              },
              parentData: {
                variant: "gallery",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-c8c122c3-2493-449b-a399-9f36a3372fed",
    },
    version: 53,
  },
  {
    name: "version 53 gallery variant with 1 image",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "gallery",
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3c58d37f-7f1d-46ad-8938-e72ac3013b39",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    en: "Gallery",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-96ee4ed8-d5f7-451a-ac90-8657c4526c42",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 1,
              },
              parentData: {
                variant: "gallery",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-c8c122c3-2493-449b-a399-9f36a3372fed",
    },
    version: 53,
  },
  {
    name: "version 53 carousel variant with carouselImageCount 1",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "carousel",
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3c58d37f-7f1d-46ad-8938-e72ac3013b39",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    en: "Gallery",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-96ee4ed8-d5f7-451a-ac90-8657c4526c42",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 1,
              },
              parentData: {
                variant: "carousel",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-c8c122c3-2493-449b-a399-9f36a3372fed",
    },
    version: 53,
  },
  {
    name: "version 53 carousel variant with carouselImageCount 2",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "carousel",
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3c58d37f-7f1d-46ad-8938-e72ac3013b39",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    en: "Gallery",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-96ee4ed8-d5f7-451a-ac90-8657c4526c42",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 2,
              },
              parentData: {
                variant: "carousel",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-c8c122c3-2493-449b-a399-9f36a3372fed",
    },
    version: 53,
  },
  {
    name: "version 53 carousel variant with carouselImageCount 3",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "carousel",
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3c58d37f-7f1d-46ad-8938-e72ac3013b39",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    en: "Gallery",
                    hasLocalizedValue: "true",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-96ee4ed8-d5f7-451a-ac90-8657c4526c42",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        en: {
                          alternateText: "",
                          url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                          height: 1,
                          width: 1,
                        },
                        hasLocalizedValue: "true",
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 3,
              },
              parentData: {
                variant: "carousel",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-c8c122c3-2493-449b-a399-9f36a3372fed",
    },
    version: 53,
  },
  {
    name: "version 59 with showSectionHeading false",
    document: {},
    props: {
      styles: {
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        variant: "gallery",
        showSectionHeading: false,
      },
      slots: {
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              data: {
                images: {
                  field: "",
                  constantValue: photoGalleryData,
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
              },
            },
          },
        ],
      },
      liveVisibility: true,
    },
    version: 59,
  },
  {
    name: "version 71 carousels with accent color override",
    document: {},
    props: {
      styles: {
        variant: "carousel",
        backgroundColor: {
          selectedColor: "palette-primary-dark",
          contrastingColor: "white",
        },
        showSectionHeading: true,
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-39fc9dff-148a-4a80-abf3-58caa05615b2",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    defaultValue: "Gallery",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-e1b41234-f285-4b3f-8dbc-ab455433c16b",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1502252430442-aac78f397426?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1755745360285-0633c972b0fd?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                    {
                      assetImage: {
                        url: "https://images.unsplash.com/photo-1504548840739-580b10ae7715?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&height=570&width=1000&fit=max",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Placeholder",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                carouselImageCount: 1,
                accentColor: {
                  selectedColor: "palette-quaternary",
                  contrastingColor: "palette-quaternary-contrast",
                },
              },
              parentData: {
                variant: "carousel",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-55246979-03a9-47d9-8e23-23a91e9785f4",
    },
    version: 71,
  },
  {
    name: "version 71 carousel variant with imageFillType fit and vertical image",
    document: {},
    props: {
      styles: {
        variant: "carousel",
        backgroundColor: {
          bgColor: "bg-white",
          textColor: "text-black",
        },
        showSectionHeading: true,
      },
      slots: {
        HeadingSlot: [
          {
            type: "HeadingTextSlot",
            props: {
              id: "HeadingTextSlot-3f85a3fa-4a71-4cfc-88e6-dbc51f9a7791",
              data: {
                text: {
                  field: "",
                  constantValue: {
                    defaultValue: "Gallery",
                  },
                  constantValueEnabled: true,
                },
              },
              styles: {
                level: 2,
                align: "left",
              },
            },
          },
        ],
        PhotoGalleryWrapper: [
          {
            type: "PhotoGalleryWrapper",
            props: {
              id: "PhotoGalleryWrapper-9a1ab825-4059-4ca1-abaf-011c30ba3733",
              data: {
                images: {
                  field: "",
                  constantValue: [
                    {
                      assetImage: {
                        url: "https://placehold.co/200x800.png",
                        width: 200,
                        height: 800,
                        assetImage: {
                          name: "Vertical Placeholder",
                        },
                      },
                    },
                    {
                      assetImage: {
                        url: "https://placehold.co/1000x570.png",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Horizontal Placeholder 1",
                        },
                      },
                    },
                    {
                      assetImage: {
                        url: "https://placehold.co/1000x570.png?text=Slide+3",
                        width: 1000,
                        height: 570,
                        assetImage: {
                          name: "Horizontal Placeholder 2",
                        },
                      },
                    },
                  ],
                  constantValueEnabled: true,
                },
              },
              styles: {
                image: {
                  aspectRatio: 1.78,
                },
                imageFillType: "fit",
                carouselImageCount: 1,
              },
              parentData: {
                variant: "carousel",
              },
            },
          },
        ],
      },
      liveVisibility: true,
      id: "PhotoGallerySection-329fca65-e47f-4168-bdc2-af6b77a771a5",
    },
    version: 71,
  },
];

describe("PhotoGallerySection", async () => {
  const puckConfig: Config = {
    components: {
      PhotoGallerySection,
      MainContent,
      ...sharedComponentConfigs,
    },
    root: {
      render: ({ children }: { children: React.ReactNode }) => {
        return <>{children}</>;
      },
    },
  };

  it.each(transformTests(tests))(
    "$viewport.name $name",
    async ({
      document,
      name,
      props,
      interactions,
      version,
      viewport: { width, height, name: viewportName },
    }) => {
      const data = migrate(
        puckConfig,
        {
          root: {
            props: {
              version,
            },
          },
          content: [
            {
              type: "PhotoGallerySection",
              props: props,
            },
          ],
        },
        document,
        migrationRegistry
      );

      const { container } = reactRender(
        <VisualEditorProvider templateProps={{ document }}>
          <Render config={puckConfig} data={data} />
        </VisualEditorProvider>
      );

      await page.viewport(width, height);
      const images = Array.from(container.querySelectorAll("img"));
      await waitFor(() => {
        if (data.content[0].props.styles?.variant === "gallery") {
          expect(images.every((i) => i.complete)).toBe(true);
        } else {
          const imagesPerSlide =
            data.content[0].props.slots?.PhotoGalleryWrapper[0].props.styles
              ?.carouselImageCount ?? 1;
          expect(images.slice(0, imagesPerSlide).every((i) => i.complete)).toBe(
            true
          );
        }
      });

      await expect(
        `PhotoGallerySection/[${viewportName}] ${name}`
      ).toMatchScreenshot();
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      if (interactions) {
        await interactions(page);
        await expect(
          `PhotoGallerySection/[${viewportName}] ${name} (after interactions)`
        ).toMatchScreenshot();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    }
  );
  it("when a team headshot mapping changes then interactive mode uses the current images", async (): Promise<void> => {
    const streamDocument: StreamDocument = {
      locale: "en",
      c_team: {
        people: [
          {
            headshot: {
              url: "https://example.com/jane.jpg",
              width: 100,
              height: 100,
              alternateText: "Jane",
            },
            cta: { label: "View Jane", link: "/team/jane", linkType: "URL" },
          },
        ],
      },
    };
    const config: Config = {
      ...puckConfig,
      components: {
        ...puckConfig.components,
        PhotoGalleryWrapper: {
          ...PhotoGalleryWrapper,
          fields: toPuckFields(PhotoGalleryWrapper.fields!),
        },
      },
    };
    const data = await resolveAllData(
      {
        root: {},
        content: [
          {
            type: "PhotoGallerySection",
            props: {
              ...PhotoGallerySection.defaultProps,
              id: "team-gallery",
              styles: { variant: "gallery", showSectionHeading: true },
              slots: {
                ...PhotoGallerySection.defaultProps!.slots,
                HeadingSlot: [
                  {
                    type: "HeadingTextSlot",
                    props: {
                      ...PhotoGallerySection.defaultProps!.slots!.HeadingSlot[0]
                        .props,
                      id: "team-gallery-heading",
                    },
                  },
                ],
                PhotoGalleryWrapper: [
                  {
                    type: "PhotoGalleryWrapper",
                    props: {
                      ...PhotoGalleryWrapper.defaultProps,
                      id: "team-images",
                      data: {
                        images: {
                          ...photoGallerySource.defaultValue,
                          field: "c_team.people",
                          constantValueEnabled: false,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      config,
      { streamDocument }
    );

    const Controls = (): React.ReactElement => {
      const getPuck = useGetPuck();
      return (
        <>
          <button
            onClick={() => {
              const { getItemById, getSelectorForId, dispatch } = getPuck();
              const item = getItemById("team-images")!;
              const selector = getSelectorForId("team-images")!;
              dispatch({
                type: "replace",
                destinationIndex: selector.index,
                destinationZone: selector.zone,
                data: {
                  ...item,
                  props: {
                    ...item.props,
                    data: {
                      images: {
                        ...item.props.data.images,
                        mappings: {
                          image: {
                            field: item.props.data.images.mappings.image.field
                              ? ""
                              : "headshot",
                            constantValueEnabled: false,
                          },
                          link: { field: "cta", constantValueEnabled: false },
                        },
                      },
                    },
                  },
                },
              });
            }}
          >
            Change headshot mapping
          </button>
          <button
            onClick={() =>
              getPuck().dispatch({
                type: "setUi",
                ui: { previewMode: "interactive" },
              })
            }
          >
            Interactive mode
          </button>
        </>
      );
    };

    const { container } = reactRender(
      <VisualEditorProvider templateProps={{ document: streamDocument }}>
        <Puck
          config={config}
          data={data}
          metadata={{ streamDocument }}
          iframe={{ enabled: false }}
        >
          <Controls />
          <Puck.Preview />
        </Puck>
      </VisualEditorProvider>
    );

    // Let Puck finish its initial data resolution before changing a child slot.
    await act(async (): Promise<void> => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    fireEvent.click(
      within(container).getByRole("button", { name: "Change headshot mapping" })
    );
    await waitFor(() => {
      expect(within(container).getByAltText("Jane")).toBeDefined();
    });
    fireEvent.click(
      within(container).getByRole("button", {
        name: "Interactive mode",
      })
    );
    await waitFor(() => {
      expect(
        within(container)
          .getByRole("link", { name: "Jane" })
          .getAttribute("href")
      ).toBe("/team/jane");
    });

    fireEvent.click(
      within(container).getByRole("button", { name: "Change headshot mapping" })
    );
    await waitFor(() => {
      expect(
        within(container).queryByRole("region", {
          name: "Photo Gallery Section",
        })
      ).toBeNull();
    });
    fireEvent.click(
      within(container).getByRole("button", { name: "Change headshot mapping" })
    );
    await waitFor(() => {
      expect(
        within(container).getByRole("link", { name: "Jane" })
      ).toBeDefined();
    });
  });

  it.each([
    { constantValueEnabled: false, initialIsMappedContentEmpty: false },
    { constantValueEnabled: false, initialIsMappedContentEmpty: true },
    { constantValueEnabled: true, initialIsMappedContentEmpty: false },
    { constantValueEnabled: true, initialIsMappedContentEmpty: true },
  ])(
    "when an empty gallery has manual mode $constantValueEnabled and saved empty state $initialIsMappedContentEmpty then visibility follows its current source",
    async ({
      constantValueEnabled,
      initialIsMappedContentEmpty,
    }): Promise<void> => {
      const { container } = reactRender(
        <VisualEditorProvider
          templateProps={{ document: { locale: "en", c_team: { people: [] } } }}
        >
          <Render
            config={puckConfig}
            data={{
              root: {},
              content: [
                {
                  type: "PhotoGallerySection",
                  props: {
                    ...PhotoGallerySection.defaultProps,
                    id: "empty-gallery",
                    styles: { variant: "gallery", showSectionHeading: false },
                    conditionalRender: {
                      isMappedContentEmpty: initialIsMappedContentEmpty,
                    },
                    slots: {
                      HeadingSlot: [],
                      PhotoGalleryWrapper: [
                        {
                          type: "PhotoGalleryWrapper",
                          props: {
                            ...PhotoGalleryWrapper.defaultProps,
                            id: "empty-images",
                            parentData: { variant: "gallery" },
                            data: {
                              images: {
                                ...photoGallerySource.defaultValue,
                                field: "c_team.people",
                                constantValueEnabled,
                                constantValue: [],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }}
          />
        </VisualEditorProvider>
      );

      await waitFor(() => {
        expect(
          within(container).queryByRole("region", {
            name: "Photo Gallery Section",
          }) !== null
        ).toBe(constantValueEnabled);
      });
    }
  );
  it.each([
    { version: 37, constantValueEnabled: true },
    { version: 37, constantValueEnabled: false },
    { version: 82, constantValueEnabled: true },
    { version: 82, constantValueEnabled: false },
  ])(
    "when a version $version gallery has manual mode $constantValueEnabled then migration and reload keep its image and link",
    async ({ version, constantValueEnabled }): Promise<void> => {
      const streamDocument: StreamDocument = {
        locale: "en",
        photoGallery: [
          {
            image: {
              url: "https://example.com/mapped.jpg",
              width: 200,
              height: 100,
              alternateText: "Mapped image",
            },
            clickthroughUrl: "/mapped",
          },
        ],
      };
      const images = {
        field: "photoGallery",
        constantValueEnabled,
        constantValue: [
          {
            assetImage: {
              url: "https://example.com/manual.jpg",
              width: 200,
              height: 100,
              alternateText: "Manual image",
            },
            clickthroughUrl: "/manual",
          },
        ],
      };
      const migratedData = migrate(
        puckConfig,
        {
          root: { props: { version } },
          content: [
            {
              type: "PhotoGallerySection",
              props:
                version === 37
                  ? {
                      id: "old-gallery",
                      data: { images },
                      styles: {
                        variant: "gallery",
                        image: { width: 200, aspectRatio: 2 },
                      },
                      liveVisibility: true,
                    }
                  : {
                      ...PhotoGallerySection.defaultProps,
                      id: "old-gallery",
                      styles: { variant: "gallery", showSectionHeading: false },
                      slots: {
                        HeadingSlot: [],
                        PhotoGalleryWrapper: [
                          {
                            type: "PhotoGalleryWrapper",
                            props: {
                              ...PhotoGalleryWrapper.defaultProps,
                              id: "old-images",
                              data: { images },
                            },
                          },
                        ],
                      },
                    },
            },
          ],
        },
        streamDocument,
        migrationRegistry
      );
      const savedData = JSON.parse(JSON.stringify(migratedData));
      const reloadedData = migrate(
        puckConfig,
        savedData,
        streamDocument,
        migrationRegistry
      );
      expect(reloadedData).toEqual(savedData);
      expect(reloadedData.root.props).toMatchObject({
        version: migrationRegistry.length,
      });
      const resolvedData = await resolveAllData(reloadedData, puckConfig, {
        streamDocument,
      });
      const { container } = reactRender(
        <VisualEditorProvider templateProps={{ document: streamDocument }}>
          <Render config={puckConfig} data={resolvedData} />
        </VisualEditorProvider>
      );
      const link = await within(container).findByRole("link", {
        name: constantValueEnabled ? "Manual image" : "Mapped image",
      });
      expect(link.getAttribute("href")).toBe(
        constantValueEnabled ? "/manual" : "/mapped"
      );
      expect(container.querySelectorAll("img")).toHaveLength(1);
      expect(link.querySelector("img")?.getAttribute("src")).toContain(
        constantValueEnabled ? "manual.jpg" : "mapped.jpg"
      );
    }
  );
});

describe("PhotoGalleryWrapper", () => {
  it.each([
    {
      name: "gallery",
      parentData: { variant: "gallery" as const },
      isEditing: false,
      copies: 1,
    },
    {
      name: "desktop and mobile carousels",
      parentData: { variant: "carousel" as const },
      isEditing: false,
      copies: 2,
    },
    {
      name: "editor",
      parentData: { variant: "gallery" as const },
      isEditing: true,
      copies: 1,
    },
  ])(
    "when brands have optional links then the $name shows each brand",
    ({ parentData, isEditing, copies }) => {
      const { container } = reactRender(
        <VisualEditorProvider
          templateProps={{
            document: {
              locale: "en",
              c_brands: [
                {
                  logo: {
                    url: "https://example.com/varilux.jpg",
                    width: 100,
                    height: 100,
                    alternateText: "Varilux",
                  },
                  cta: {
                    label: "Varilux",
                    link: "https://example.com/varilux",
                  },
                },
                {
                  logo: {
                    url: "https://example.com/crizal.jpg",
                    width: 100,
                    height: 100,
                    alternateText: "Crizal",
                  },
                  cta: { label: "Crizal", link: "https://example.com/crizal" },
                },
                {
                  logo: {
                    url: "https://example.com/essilor.jpg",
                    width: 100,
                    height: 100,
                    alternateText: "Essilor",
                  },
                },
              ],
            },
          }}
        >
          <PhotoGalleryWrapper.render
            id="brands"
            data={{
              images: {
                field: "c_brands",
                constantValueEnabled: false,
                constantValue: [],
                mappings: {
                  image: {
                    field: "logo",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                  link: {
                    field: "cta",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                },
              },
            }}
            styles={{
              image: { width: 100, aspectRatio: 1 },
              carouselImageCount: 3,
            }}
            parentData={parentData}
            puck={{
              isEditing,
              dragRef: null,
              metadata: {},
              renderDropZone: () => <div />,
            }}
          />
        </VisualEditorProvider>
      );

      for (const [name, href] of [
        ["Varilux", "https://example.com/varilux"],
        ["Crizal", "https://example.com/crizal"],
        ["Essilor", null],
      ] as const) {
        const images = within(container).getAllByAltText(name);
        expect(images).toHaveLength(copies);
        for (const image of images) {
          expect(image.closest("a")?.getAttribute("href") ?? null).toBe(
            isEditing ? null : href
          );
        }
      }
      expect(container.querySelectorAll("a")).toHaveLength(
        isEditing ? 0 : 2 * copies
      );
    }
  );

  it("when a manual image has a link then it uses the page language and entity values", () => {
    const { container } = reactRender(
      <VisualEditorProvider
        templateProps={{ document: { name: "Paris", slug: "paris" } }}
      >
        <PhotoGalleryWrapper.render
          id="manual-gallery"
          data={{
            images: {
              ...photoGallerySource.defaultValue,
              constantValue: [
                {
                  image: {
                    field: "",
                    constantValueEnabled: true,
                    constantValue: {
                      defaultValue: {
                        url: "https://example.com/brand.jpg",
                        width: 100,
                        height: 100,
                        alternateText: { defaultValue: "Brand [[name]]" },
                      },
                    },
                  },
                  link: {
                    field: "",
                    constantValueEnabled: true,
                    constantValue: { defaultValue: "/[[slug]]" },
                  },
                },
              ],
            },
          }}
          styles={{
            image: { width: 100, aspectRatio: 1 },
            carouselImageCount: 3,
          }}
          parentData={{ variant: "gallery" }}
          puck={{
            isEditing: false,
            dragRef: null,
            metadata: {},
            renderDropZone: () => <div />,
          }}
        />
      </VisualEditorProvider>
    );

    expect(
      within(container)
        .getByRole("link", { name: "Brand Paris" })
        .getAttribute("href")
    ).toBe("/paris");
  });

  it.each([
    {
      viewport: 375,
      imageWidth: 1000,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 800,
      imageWidth: 1000,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 1440,
      imageWidth: 1000,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 375,
      imageWidth: 100,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 800,
      imageWidth: 100,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 1440,
      imageWidth: 100,
      parentData: { variant: "gallery" as const },
    },
    {
      viewport: 375,
      imageWidth: 1000,
      parentData: { variant: "carousel" as const },
    },
    {
      viewport: 800,
      imageWidth: 1000,
      parentData: { variant: "carousel" as const },
    },
    {
      viewport: 1440,
      imageWidth: 1000,
      parentData: { variant: "carousel" as const },
    },
    {
      viewport: 375,
      imageWidth: 100,
      parentData: { variant: "carousel" as const },
    },
    {
      viewport: 800,
      imageWidth: 100,
      parentData: { variant: "carousel" as const },
    },
    {
      viewport: 1440,
      imageWidth: 100,
      parentData: { variant: "carousel" as const },
    },
  ])(
    "when $parentData.variant images have links at $viewport px then their $imageWidth px size stays the same",
    async ({ viewport, imageWidth, parentData }): Promise<void> => {
      await page.viewport(viewport, 900);
      const { container, rerender } = reactRender(<></>);
      let unlinkedSizes: { width: number; height: number }[] = [];

      for (const linkField of ["", "cta", "cta.link"]) {
        rerender(
          <VisualEditorProvider
            templateProps={{
              document: {
                locale: "en",
                c_brands: Array.from({ length: 3 }, () => ({
                  logo: {
                    url: "https://example.com/brand.jpg",
                    width: 1000,
                    height: 570,
                    alternateText: "Brand",
                  },
                  cta: { label: "Brand", link: "/brand", linkType: "URL" },
                })),
              },
            }}
          >
            <PhotoGalleryWrapper.render
              id="sized-gallery"
              data={{
                images: {
                  ...photoGallerySource.defaultValue,
                  field: "c_brands",
                  constantValueEnabled: false,
                  mappings: {
                    image: {
                      field: "logo",
                      constantValueEnabled: false,
                      constantValue: undefined,
                    },
                    link: {
                      field: linkField,
                      constantValueEnabled: false,
                      constantValue: undefined,
                    },
                  },
                },
              }}
              styles={{
                image: { width: imageWidth, aspectRatio: 1.78 },
                carouselImageCount: 3,
              }}
              parentData={parentData}
              puck={{
                isEditing: false,
                dragRef: null,
                metadata: {},
                renderDropZone: () => <div />,
              }}
            />
          </VisualEditorProvider>
        );

        await waitFor(() => {
          if (parentData.variant === "carousel") {
            // Wait for ResizeObserver to set the slide count before measuring.
            expect(
              within(container).getAllByRole("option", { selected: true })
            ).toHaveLength(viewport < 750 ? 1 : 3);
          }
          const sizes = within(container)
            .getAllByAltText("Brand")
            .map((image) => image.getBoundingClientRect())
            .filter(({ width }) => width > 0);
          expect(sizes).toHaveLength(3);
          sizes.forEach(({ width, height }, index) => {
            expect(width).toBeLessThanOrEqual(Math.min(imageWidth, viewport));
            expect(height).toBeGreaterThan(0);
            if (linkField) {
              expect(width).toBeCloseTo(unlinkedSizes[index].width, 1);
              expect(height).toBeCloseTo(unlinkedSizes[index].height, 1);
            }
          });
          if (!linkField) {
            unlinkedSizes = sizes;
          }
        });
      }
    }
  );
  it.each([
    {
      parentData: { variant: "gallery" as const },
      isEditing: false,
      copies: 1,
    },
    {
      parentData: { variant: "carousel" as const },
      isEditing: false,
      copies: 2,
    },
    { parentData: { variant: "gallery" as const }, isEditing: true, copies: 1 },
    {
      parentData: { variant: "carousel" as const },
      isEditing: true,
      copies: 2,
    },
  ])(
    "when team CTAs use different link types and edit mode is $isEditing then $parentData keeps the images and link actions",
    ({ parentData, isEditing, copies }): void => {
      const { container } = reactRender(
        <VisualEditorProvider
          templateProps={{
            document: {
              locale: "en",
              c_team: {
                people: [
                  {
                    headshot: {
                      url: "https://example.com/jane.jpg",
                      width: 100,
                      height: 100,
                      alternateText: "Jane",
                    },
                    cta: { link: "jane@example.com", linkType: "EMAIL" },
                  },
                  {
                    headshot: {
                      url: "https://example.com/john.jpg",
                      width: 100,
                      height: 100,
                    },
                    cta: {
                      link: "+12125550100",
                      linkType: "PHONE",
                      label: "Call John",
                    },
                  },
                  {
                    headshot: {
                      url: "https://example.com/jill.jpg",
                      width: 100,
                      height: 100,
                      alternateText: "Jill",
                    },
                    cta: { link: "/Team/Jill", linkType: "URL" },
                  },
                  {
                    headshot: {
                      url: "https://example.com/jack.jpg",
                      width: 100,
                      height: 100,
                      alternateText: "Jack",
                    },
                    cta: { link: " ", linkType: "URL" },
                  },
                ],
              },
            },
          }}
        >
          <PhotoGalleryWrapper.render
            id="team-links"
            data={{
              images: {
                ...photoGallerySource.defaultValue,
                field: "c_team.people",
                constantValueEnabled: false,
                mappings: {
                  image: {
                    field: "headshot",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                  link: {
                    field: "cta",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                },
              },
            }}
            styles={{
              image: { width: 100, aspectRatio: 1 },
              carouselImageCount: 1,
            }}
            parentData={parentData}
            puck={{
              isEditing,
              dragRef: null,
              metadata: {},
              renderDropZone: () => <div />,
            }}
          />
        </VisualEditorProvider>
      );
      expect(container.querySelectorAll("img")).toHaveLength(4 * copies);
      expect(container.querySelectorAll("a")).toHaveLength(
        isEditing ? 0 : 3 * copies
      );
      if (!isEditing) {
        for (const image of within(container).getAllByAltText("Jane")) {
          // The shared CTA masks email addresses in the HTML link.
          expect(atob(image.closest("a")!.getAttribute("href")!)).toBe(
            "mailto:jane@example.com"
          );
        }
        for (const link of container.querySelectorAll(
          'a[aria-label="Call John"]'
        )) {
          expect(link.getAttribute("href")).toBe("tel:+12125550100");
        }
        expect(
          container.querySelectorAll('a[aria-label="Call John"]')
        ).toHaveLength(copies);
        for (const image of within(container).getAllByAltText("Jill")) {
          expect(image.closest("a")!.getAttribute("href")).toBe("/Team/Jill");
        }
      }
      for (const image of within(container).getAllByAltText("Jack")) {
        expect(image.closest("a")).toBeNull();
      }
    }
  );

  it("when a carousel source changes from three images to one then the last image stays visible", async (): Promise<void> => {
    await page.viewport(1440, 900);
    const props = {
      id: "changing-gallery",
      data: {
        images: {
          ...photoGallerySource.defaultValue,
          field: "photoGallery",
          constantValueEnabled: false,
          mappings: {
            link: {
              field: "",
              constantValueEnabled: false,
              constantValue: undefined,
            },
            image: {
              field: "$item",
              constantValueEnabled: false,
              constantValue: undefined,
            },
          },
        },
      },
      styles: { image: { width: 100, aspectRatio: 1 }, carouselImageCount: 3 },
      parentData: { variant: "carousel" as const },
      puck: {
        isEditing: false,
        dragRef: null,
        metadata: {},
        renderDropZone: (): React.ReactElement => <div />,
      },
    };
    const { container, rerender } = reactRender(
      <VisualEditorProvider
        templateProps={{
          document: {
            photoGallery: [
              {
                url: "https://example.com/one.jpg",
                width: 100,
                height: 100,
                alternateText: "One",
              },
              {
                url: "https://example.com/two.jpg",
                width: 100,
                height: 100,
                alternateText: "Two",
              },
              {
                url: "https://example.com/three.jpg",
                width: 100,
                height: 100,
                alternateText: "Three",
              },
            ],
          },
        }}
      >
        <PhotoGalleryWrapper.render {...props} />
      </VisualEditorProvider>
    );
    await waitFor(() =>
      expect(
        container.querySelectorAll(".carousel__slide--visible")
      ).toHaveLength(6)
    );
    rerender(
      <VisualEditorProvider
        templateProps={{
          document: {
            photoGallery: [
              {
                url: "https://example.com/one.jpg",
                width: 100,
                height: 100,
                alternateText: "One",
              },
            ],
          },
        }}
      >
        <PhotoGalleryWrapper.render {...props} />
      </VisualEditorProvider>
    );
    await waitFor(() => {
      expect(
        container.querySelectorAll(".carousel__slide--visible")
      ).toHaveLength(2);
      const image = within(container).getAllByAltText("One")[0];
      expect(image.getBoundingClientRect().width).toBeGreaterThan(0);
      expect(
        image.closest(".carousel__slide")!.getAttribute("aria-selected")
      ).toBe("true");
      expect(
        container.querySelectorAll(
          ".carousel__back-button:enabled, .carousel__next-button:enabled"
        )
      ).toHaveLength(0);
    });
  });

  it.each([viewports.desktop, viewports.tablet, viewports.mobile])(
    "$name item source with optional image links",
    async ({ name, width, height }): Promise<void> => {
      await page.viewport(width, height);
      const { container } = reactRender(
        <VisualEditorProvider
          templateProps={{
            document: {
              locale: "en",
              c_brands: [
                {
                  logo: {
                    url: "https://a.mktgcdn.com/p-dev/riaolTLcpz-o-o1mImrnaEaeNBs58dqlB7TS2moQgyo/2048x2048.jpg",
                    width: 2048,
                    height: 2048,
                    alternateText: "Varilux",
                  },
                  cta: {
                    label: "View Varilux",
                    link: "/varilux",
                    linkType: "URL",
                  },
                },
                {
                  logo: {
                    url: "https://a.mktgcdn.com/p-dev/2NXFA3zTVNQBcc7LCGNdTHp5SZVHIVTz_X9tLVZI6S8/2048x2048.jpg",
                    width: 2048,
                    height: 2048,
                    alternateText: "Crizal",
                  },
                  cta: {
                    label: "View Crizal",
                    link: "/crizal",
                    linkType: "URL",
                  },
                },
                {
                  logo: {
                    url: "https://a.mktgcdn.com/p-dev/KuK2XRaNDf-LF97Jt_ZMASRdUxtPiJP2MCwU6Ccmh9Q/2048x2048.jpg",
                    width: 2048,
                    height: 2048,
                    alternateText: "Essilor",
                  },
                },
              ],
            },
          }}
        >
          <PhotoGalleryWrapper.render
            id="mapped-gallery-screenshot"
            data={{
              images: {
                ...photoGallerySource.defaultValue,
                field: "c_brands",
                constantValueEnabled: false,
                mappings: {
                  image: {
                    field: "logo",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                  link: {
                    field: "cta",
                    constantValueEnabled: false,
                    constantValue: undefined,
                  },
                },
              },
            }}
            styles={{
              image: { width: 200, aspectRatio: 1 },
              carouselImageCount: 3,
            }}
            parentData={{ variant: "gallery" }}
            puck={{
              isEditing: false,
              dragRef: null,
              metadata: {},
              renderDropZone: (): React.ReactElement => <div />,
            }}
          />
        </VisualEditorProvider>
      );

      await waitFor(
        () => {
          const images = Array.from(container.querySelectorAll("img"));
          expect(images).toHaveLength(3);
          for (const image of images) {
            expect(image.complete).toBe(true);
            expect(image.naturalWidth).toBeGreaterThan(0);
          }
        },
        { timeout: 5000 }
      );
      expect(
        within(container)
          .getByRole("link", { name: "Varilux" })
          .getAttribute("href")
      ).toBe("/varilux");
      expect(
        within(container)
          .getByRole("link", { name: "Crizal" })
          .getAttribute("href")
      ).toBe("/crizal");
      expect(within(container).getByAltText("Essilor").closest("a")).toBeNull();
      await expect(
        `PhotoGalleryWrapper/[${name}] item source with optional image links`
      ).toMatchScreenshot();
      expect(await axe(container)).toHaveNoViolations();
    }
  );
});
