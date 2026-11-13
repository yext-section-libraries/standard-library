import { PuckComponent } from "@puckeditor/core";
import { msg, SectionConfig, YextComponentConfig } from "@yext/visual-editor";
import { ComponentErrorBoundary } from "@yext/visual-editor/section-library-support";
import { VisibilityWrapper } from "../shared/sectionSupport/atoms/visibilityWrapper.tsx";

export interface BrandingPreviewSectionProps {
  /** Whether the branding preview is visible on the live page. */
  liveVisibility: boolean;
}

const palette = [
  ["Page background", "Foreground text", "ve-theme-page"],
  ["Primary", "Primary foreground text", "ve-theme-primary"],
  ["Secondary", "Secondary foreground text", "ve-theme-secondary"],
  ["Accent", "Accent foreground text", "ve-theme-accent"],
  ["Muted", "Muted foreground text", "ve-theme-muted"],
] as const;

// A local illustration keeps the preview independent of external image services.
const cardImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 320"><rect width="640" height="320" fill="#e5e7eb"/><circle cx="480" cy="90" r="48" fill="#fff"/><path d="M0 320 200 100 400 320ZM240 320 440 160 640 320Z" fill="#9ca3af"/></svg>'
)}`;

const InteractivePreview = () => (
  <div className="flex flex-wrap items-center gap-4">
    <button type="button" className="ve-theme-primary-button">
      Primary button
    </button>
    <button type="button" className="ve-theme-secondary-button">
      Secondary button
    </button>
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      className="ve-theme-link"
    >
      Text link
    </a>
    <a
      href="#"
      onClick={(event) => event.preventDefault()}
      className="ve-theme-navigation-link"
    >
      Navigation link
    </a>
  </div>
);

const BrandingPreviewComponent: PuckComponent<
  BrandingPreviewSectionProps
> = () => (
  <section
    aria-label="Branding preview"
    className="ve-theme-page ve-theme-body ve-theme-section px-4 sm:px-6"
  >
    <div className="ve-theme-content min-w-0 space-y-10">
      <header className="space-y-2">
        <h2 className="ve-theme-headline">Branding preview</h2>
        <p className="ve-theme-eyebrow">
          See your colors, typography, and styles together as you adjust your
          theme.
        </p>
      </header>

      <section aria-label="Color palette" className="space-y-4">
        <h3 className="ve-theme-section-title">Color palette</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {palette.map(([label, foregroundLabel, className]) => (
            <div key={className} className="min-w-0 space-y-2">
              <p>{label}</p>
              <div
                className={`${className} flex min-h-[6rem] items-center justify-center p-4 text-center`}
              >
                {foregroundLabel}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p>Border</p>
            <div className="ve-theme-page ve-theme-border flex min-h-[6rem] items-center justify-center border-2 p-4 text-center">
              Theme border
            </div>
          </div>
          <div className="space-y-2">
            <p>Focus ring</p>
            <div
              className="ve-theme-page flex min-h-[6rem] items-center justify-center p-4 text-center"
              style={{
                outline: "2px solid var(--ve-color-focus-ring)",
                outlineOffset: "2px",
              }}
            >
              Focus ring
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Typography" className="space-y-4 break-words">
        <h3 className="ve-theme-section-title">Typography</h3>
        <p className="ve-theme-headline">Headline / Page title</p>
        <p className="ve-theme-section-title">Section title</p>
        <p className="ve-theme-card-title">Card title</p>
        <p className="ve-theme-eyebrow">Eyebrow text introduces your story.</p>
        <p className="ve-theme-body-large">
          Large body text gives key details room to stand out.
        </p>
        <p className="ve-theme-body">
          Body text shares the details. The quick brown fox jumps over the lazy
          dog. 0123456789
        </p>
        <p className="ve-theme-body-small">
          Small body text for captions, notes, and supporting details.
        </p>
      </section>

      <section aria-label="Buttons and links" className="space-y-4">
        <h3 className="ve-theme-section-title">Buttons and links</h3>
        <p>
          Hover, press, or use the Tab key to preview interaction styles. These
          sample controls keep you on this page.
        </p>
        <div className="ve-theme-page ve-theme-border space-y-4 border p-6">
          <h4 className="ve-theme-card-title">On the page surface</h4>
          <InteractivePreview />
        </div>
        <div className="ve-theme-on-dark space-y-4 bg-gray-950 p-6 text-white">
          <h4 className="ve-theme-card-title">On an image overlay</h4>
          <InteractivePreview />
        </div>
      </section>

      <section aria-label="Nested surfaces" className="space-y-4">
        <h3 className="ve-theme-section-title">Nested surfaces</h3>
        <div className="ve-theme-primary space-y-6 p-6">
          <p className="ve-theme-body">Interactions on the primary surface</p>
          <InteractivePreview />
          <article className="ve-theme-page ve-theme-card space-y-4 p-6">
            <h4 className="ve-theme-card-title">
              A page-colored card inside primary
            </h4>
            <p className="ve-theme-body-large">
              Large body text gives key details room to stand out.
            </p>
            <p className="ve-theme-body">
              These controls follow the card surface as you edit the theme.
            </p>
            <InteractivePreview />
          </article>
        </div>
      </section>

      <section aria-label="Example card" className="space-y-4">
        <h3 className="ve-theme-section-title">Example card</h3>
        <article className="ve-theme-card ve-theme-muted max-w-md space-y-4 p-6">
          <img
            src={cardImage}
            alt=""
            width={640}
            height={320}
            className="ve-theme-image block h-auto w-full"
          />
          <h4 className="ve-theme-card-title">Your brand in action</h4>
          <p className="ve-theme-body-large">
            Large body text gives key details room to stand out.
          </p>
          <p className="ve-theme-body">
            Bring your typography, colors, image corners, and card borders
            together in one place.
          </p>
          <p className="ve-theme-body-small">A sample of your page styles.</p>
          <button type="button" className="ve-theme-primary-button">
            Explore more
          </button>
        </article>
      </section>
    </div>
  </section>
);

export const BrandingPreviewSection: YextComponentConfig<BrandingPreviewSectionProps> =
  {
    label: msg("components.brandingPreview", "Branding Preview"),
    fields: {
      liveVisibility: {
        label: msg("fields.visibleOnLivePage", "Visible on Live Page"),
        type: "radio",
        options: [
          { label: msg("fields.options.show", "Show"), value: true },
          { label: msg("fields.options.hide", "Hide"), value: false },
        ],
      },
    },
    defaultProps: { liveVisibility: true },
    render: (props) => (
      <ComponentErrorBoundary
        isEditing={props.puck.isEditing}
        resetKeys={[props]}
      >
        <VisibilityWrapper
          liveVisibility={props.liveVisibility}
          isEditing={props.puck.isEditing}
        >
          <BrandingPreviewComponent {...props} />
        </VisibilityWrapper>
      </ComponentErrorBoundary>
    ),
  };

export const config: SectionConfig = {
  id: "BrandingPreviewSection",
  displayName: "Branding Preview",
  description:
    "Previews the theme color palette, typography, buttons, links, and card styles.",
  pageSetTypes: ["ENTITY"],
  category: "Page Sections",
};
