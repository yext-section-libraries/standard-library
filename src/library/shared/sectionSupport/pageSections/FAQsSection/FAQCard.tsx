import * as React from "react";
import { PuckComponent } from "@puckeditor/core";
import { Body } from "../../atoms/body.tsx";
import {
  FAQStruct,
  TranslatableRichText,
  TranslatableString,
  getDefaultRTF,
  msg,
  resolveComponentData,
  resolveDataFromParent,
  useDocument,
  YextEntityField,
  ThemeColor,
  YextComponentConfig,
  YextFields,
} from "@yext/visual-editor";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../atoms/accordion.tsx";
import { useAnalytics } from "@yext/pages-components";
import { useTranslation } from "react-i18next";
import {
  useThemeData,
  resolveThemeEntry,
  useCardContext,
  useGetCardSlots,
} from "@yext/visual-editor/section-library-support";

const defaultFAQ = {
  question: { defaultValue: "Question Lorem ipsum dolor sit amet?" },
  answer: {
    defaultValue: getDefaultRTF(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
    ),
  },
} satisfies FAQStruct;

export const defaultFAQCardData = (
  id?: string,
  index?: number,
  questionTypographyId?: string,
  answerTypographyId?: string,
  answerColor?: ThemeColor
) => ({
  type: "FAQCard",
  props: {
    ...(id && { id }),
    ...(index !== undefined && { index }),
    data: {
      question: {
        constantValueEnabled: true,
        constantValue: defaultFAQ.question,
        field: "",
      },
      answer: {
        constantValueEnabled: true,
        constantValue: defaultFAQ.answer,
        field: "",
      },
    },
    styles: {
      questionTypographyId: questionTypographyId,
      answerTypographyId: answerTypographyId,
      answerColor: answerColor,
    },
    slots: {},
  },
});

export type FAQCardProps = {
  /** @internal */
  field?: string;

  /** @internal */
  question?: FAQStruct["question"];
  /** @internal */
  answer?: FAQStruct["answer"];

  data: {
    question: YextEntityField<TranslatableString | TranslatableRichText>;
    answer: YextEntityField<TranslatableRichText>;
  };

  /** @internal */
  slots: {};

  /** Styling for all the FAQ cards. */
  styles: {
    questionTypographyId?: string;
    answerTypographyId?: string;
    answerColor?: ThemeColor;
  };

  /** @internal */
  index?: number;
};

const FAQCardFields: YextFields<FAQCardProps> = {
  data: {
    type: "object",
    label: msg("fields.data", "Data"),
    objectFields: {
      question: {
        type: "entityField",
        label: msg("fields.question", "Question"),
        filter: {
          types: ["type.string", "type.rich_text_v2"],
        },
      },
      answer: {
        type: "entityField",
        label: msg("fields.answer", "Answer"),
        filter: {
          types: ["type.rich_text_v2"],
        },
      },
    },
  },
  styles: {
    type: "object",
    label: msg("fields.styles", "Styles"),
    objectFields: {
      questionTypographyId: {
        generation: { required: false, nullable: true },
        label: msg("fields.questionTypographyId", "Question Variant"),
        type: "themeCollection",
        collection: "typography",
      },
      answerTypographyId: {
        generation: { required: false, nullable: true },
        label: msg("fields.answerTypographyId", "Answer Variant"),
        type: "themeCollection",
        collection: "typography",
      },
      answerColor: {
        type: "basicSelector",
        label: msg("fields.answerColor", "Answer Color"),
        options: "SITE_COLOR",
      },
    },
  },
  slots: {
    type: "object",
    objectFields: {},
    visible: false,
  },
};

const FAQCardComponent: PuckComponent<FAQCardProps> = (props) => {
  const { data, styles, index, puck } = props;
  const analytics = useAnalytics();
  const { i18n } = useTranslation();
  const streamDocument = useDocument();

  const { sharedCardProps, setSharedCardProps } = useCardContext<{
    questionTypographyId?: string;
    answerTypographyId?: string;
    answerColor?: ThemeColor;
  }>();

  const { getPuck } = useGetCardSlots<FAQCardProps>(props.id);

  // When the context changes, dispatch an update to sync the changes to puck
  React.useEffect(() => {
    if (!puck.isEditing || !sharedCardProps || !getPuck) {
      return;
    }

    if (
      sharedCardProps.questionTypographyId === styles.questionTypographyId &&
      sharedCardProps.answerTypographyId === styles.answerTypographyId &&
      sharedCardProps.answerColor?.selectedColor ===
        styles.answerColor?.selectedColor
    ) {
      return;
    }

    const { dispatch, getSelectorForId } = getPuck();
    const selector = getSelectorForId(props.id);
    if (!selector) {
      return;
    }

    // oxlint-disable-next-line no-unused-vars: remove props.puck before dispatching to avoid writing it to the saved data
    const { puck: _, editMode: __, ...otherProps } = props;
    dispatch({
      type: "replace" as const,
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        type: "FAQCard",
        props: {
          ...otherProps,
          styles: {
            questionTypographyId: sharedCardProps.questionTypographyId,
            answerTypographyId: sharedCardProps.answerTypographyId,
            answerColor: sharedCardProps.answerColor,
          },
        } satisfies FAQCardProps,
      },
    });
  }, [
    sharedCardProps?.answerTypographyId,
    sharedCardProps?.questionTypographyId,
    sharedCardProps?.answerColor?.selectedColor,
  ]);

  // When the card's shared props change, update the context
  React.useEffect(() => {
    if (!puck.isEditing) {
      return;
    }

    if (
      sharedCardProps?.questionTypographyId === styles.questionTypographyId &&
      sharedCardProps?.answerTypographyId === styles.answerTypographyId &&
      sharedCardProps?.answerColor?.selectedColor ===
        styles.answerColor?.selectedColor
    ) {
      return;
    }

    setSharedCardProps({
      questionTypographyId: styles.questionTypographyId,
      answerTypographyId: styles.answerTypographyId,
      answerColor: styles.answerColor,
    });
  }, [styles]);

  const sourceQuestion = props.question ?? data.question;
  const resolvedQuestion = sourceQuestion
    ? resolveComponentData(sourceQuestion, i18n.language, streamDocument, {
        output: "plainText",
      })
    : "";

  const theme = useThemeData();
  const answerTypography = resolveThemeEntry(
    theme.typography,
    styles.answerTypographyId
  );
  const sourceAnswer = props.answer ?? data.answer;
  const resolvedAnswer = sourceAnswer
    ? resolveComponentData(sourceAnswer, i18n.language, streamDocument, {
        color: styles.answerColor,
      })
    : undefined;

  return (
    <AccordionItem
      key={index}
      data-ya-action={
        analytics?.getDebugEnabled() ? "EXPAND/COLLAPSE" : undefined
      }
      data-ya-eventname={
        analytics?.getDebugEnabled() ? `toggleFAQ${index}` : undefined
      }
      onToggle={(e) =>
        e.currentTarget.open // the updated state after toggling
          ? analytics?.track({
              action: "EXPAND",
              eventName: `toggleFAQ${index}`,
            })
          : analytics?.track({
              action: "COLLAPSE",
              eventName: `toggleFAQ${index}`,
            })
      }
    >
      <AccordionTrigger>
        <Body typographyId={styles.questionTypographyId}>
          {resolvedQuestion}
        </Body>
      </AccordionTrigger>
      <AccordionContent>
        {typeof resolvedAnswer === "string" ? (
          <Body
            typographyId={styles.answerTypographyId}
            color={styles.answerColor}
          >
            {resolvedAnswer}
          </Body>
        ) : (
          <div className="components" data-ve-typography={answerTypography.id}>
            {resolvedAnswer}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export const FAQCard: YextComponentConfig<FAQCardProps> = {
  label: msg("faq", "FAQ"),
  fields: FAQCardFields,
  defaultProps: defaultFAQCardData().props,
  resolveFields: (data) =>
    resolveDataFromParent(
      FAQCardFields,
      data.props.field
        ? ({
            ...data,
            props: {
              ...data.props,
              parentData: { field: data.props.field },
            },
          } as typeof data)
        : data
    ),
  render: (props) => <FAQCardComponent {...props} />,
};
