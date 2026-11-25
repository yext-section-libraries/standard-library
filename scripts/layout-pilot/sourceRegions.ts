import type { JSHandle, Locator, Page, Route } from "playwright";

const headerLandmarks =
  'header, [role=banner], #header, #site-header, #global-header, .site-header, .global-header, .cmp-header, [data-testid="header" i], [class~="header" i]';
const headerSelector = `:is(${headerLandmarks}):not(article *, footer *, :is(${headerLandmarks}) *)`;
const navigationSelector =
  'nav, [role=navigation], [id*="global-nav" i], [class~="global-nav" i]';

const menuLabel =
  /^(?:(?:open|toggle|main|mobile|header) )*(?:menu|navigation)(?: open menu)?$/i;

type Rect = { x: number; y: number; width: number; height: number };
type Item = {
  tag: string;
  href?: string;
  src?: string;
  label?: string;
  text?: string;
  bounds: number[];
  style?: Record<string, string>;
  open?: boolean;
  controls?: string;
  input?: { type: string; name: string; action?: string; method?: string };
  svgReference?: string;
  children?: Item[];
};

async function readRegion(region: Locator): Promise<Item | undefined> {
  return region.evaluateAll(([root]) => {
    if (!root) return;
    let remaining = 300;
    // Method syntax keeps browser-serialized callbacks free of tsx's name helper.
    const tree = {
      publicUrl(url?: string) {
        return url && /^(https?:|mailto:|tel:)/i.test(url) ? url : undefined;
      },
      read(element: Element): Item[] {
        const style = getComputedStyle(element);
        if (
          !remaining ||
          element.matches("script, style, template") ||
          (style.display !== "contents" &&
            !element.checkVisibility({
              opacityProperty: true,
              visibilityProperty: true,
            }))
        )
          return [];
        remaining--;

        const tag = element.tagName.toLowerCase();
        const rect = element.getBoundingClientRect();
        if (
          element !== root &&
          !rect.width &&
          !rect.height &&
          !element.children.length
        )
          return [];
        const href =
          element instanceof HTMLAnchorElement
            ? tree.publicUrl(element.href)
            : undefined;
        const lazySrc =
          element instanceof HTMLImageElement ? element.dataset.src : undefined;
        const src = tree.publicUrl(
          element instanceof HTMLImageElement
            ? element.currentSrc ||
                element.src ||
                (lazySrc && URL.canParse(lazySrc, document.baseURI)
                  ? new URL(lazySrc, document.baseURI).href
                  : undefined)
            : undefined
        );
        const svgReference =
          tag === "svg"
            ? (element.querySelector("use")?.getAttribute("href") ??
              element.querySelector("use")?.getAttribute("xlink:href") ??
              undefined)
            : undefined;
        const labelledBy = (element.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim())
          .filter(Boolean)
          .join(" ");
        const label =
          element.getAttribute("aria-label") ??
          (labelledBy || undefined) ??
          (element instanceof HTMLInputElement
            ? element.labels?.[0]?.textContent
            : undefined) ??
          element.getAttribute("alt") ??
          element.getAttribute("title") ??
          element.getAttribute("placeholder") ??
          element.querySelector("svg title")?.textContent ??
          (tag === "svg"
            ? element.querySelector("title")?.textContent
            : undefined) ??
          undefined;
        const text = (
          element.matches(
            "a, button, summary, h1, h2, h3, h4, h5, h6, [role=heading]"
          )
            ? (element as HTMLElement).innerText
            : Array.from(element.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent)
                .join(" ")
        )
          ?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 300);
        const input =
          element instanceof HTMLInputElement && element.type !== "hidden"
            ? {
                type: element.type,
                name: element.name,
                action: tree.publicUrl(element.form?.action),
                method: element.form?.method,
              }
            : undefined;
        const open =
          element instanceof HTMLDetailsElement
            ? element.open
            : element.hasAttribute("aria-expanded")
              ? element.getAttribute("aria-expanded") === "true"
              : undefined;
        const children =
          tag === "svg"
            ? []
            : Array.from(element.children).flatMap((child) => tree.read(child));
        const group =
          element === root ||
          element.matches(
            "nav, section, ul, ol, details, form, [role=navigation]"
          ) ||
          children.length > 1 ||
          (children.length > 0 &&
            (style.position === "sticky" ||
              style.position === "fixed" ||
              style.backgroundColor !== "rgba(0, 0, 0, 0)"));
        const asset =
          tag === "svg" || tag === "img" || style.backgroundImage !== "none";
        if (
          !group &&
          !asset &&
          !href &&
          !label &&
          !text &&
          !input &&
          open === undefined
        )
          return children;
        return [
          {
            tag,
            href,
            src,
            label: label?.trim().slice(0, 160) || undefined,
            text: text || undefined,
            bounds: [
              rect.x + scrollX,
              rect.y + scrollY,
              rect.width,
              rect.height,
            ].map(Math.round),
            input,
            svgReference: svgReference?.slice(0, 240),
            open,
            controls: element.getAttribute("aria-controls") || undefined,
            style: {
              color: style.color,
              backgroundColor: style.backgroundColor,
              ...(style.backgroundImage !== "none" &&
              !style.backgroundImage.includes("data:")
                ? { backgroundImage: style.backgroundImage }
                : {}),
              ...(group
                ? {
                    display: style.display,
                    position: style.position,
                    columns: style.gridTemplateColumns,
                    direction: style.flexDirection,
                    gap: style.gap,
                    padding: style.padding,
                    maxWidth: style.maxWidth,
                  }
                : {}),
              ...(asset ? { objectFit: style.objectFit } : {}),
            },
            children: children.length ? children : undefined,
          },
        ];
      },
    };
    return tree.read(root)[0];
  });
}

async function readLinks(
  region: Locator,
  {
    hidden = false,
    previouslyVisible,
    remember = false,
  }: {
    hidden?: boolean;
    previouslyVisible?: JSHandle<WeakSet<HTMLAnchorElement>>;
    remember?: boolean;
  } = {}
) {
  return region.evaluateAll(
    (roots, { hidden, previouslyVisible, remember }) =>
      Array.from(
        roots[0]?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []
      ).flatMap((link) => {
        const href = link.getAttribute("href")?.trim();
        if (
          !href ||
          href === "#" ||
          !/^(https?:|mailto:|tel:)/i.test(link.href)
        )
          return [];
        const bounds = link.getBoundingClientRect();
        let visible =
          link.getClientRects().length > 0 &&
          bounds.right > 0 &&
          bounds.left < innerWidth &&
          link.checkVisibility({
            opacityProperty: true,
            visibilityProperty: true,
          }) &&
          !link.closest('[aria-hidden="true"], [inert]');
        // Keep links below the fold in normal page flow. A fixed drawer
        // outside the viewport can't be reached by scrolling the document.
        if (visible && (bounds.bottom <= 0 || bounds.top >= innerHeight)) {
          for (
            let parent: Element | null = link;
            parent;
            parent = parent.parentElement
          ) {
            if (getComputedStyle(parent).position !== "fixed") continue;
            visible = false;
            break;
          }
        }
        if (visible === hidden) return [];
        if (remember) {
          previouslyVisible?.add(link);
          return [];
        }
        if (previouslyVisible?.has(link)) return [];
        const label = (
          link.getAttribute("aria-label") ||
          (hidden ? link.textContent : link.innerText) ||
          link.querySelector("img[alt]")?.getAttribute("alt") ||
          link.querySelector("svg title")?.textContent ||
          link.getAttribute("title") ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim();
        const group = link.closest("nav, [role=navigation], section, details");
        const groupLabel =
          group?.getAttribute("aria-label") ??
          group?.querySelector(":scope > :is(h2, h3, h4, summary)")
            ?.textContent;
        return [
          {
            href: link.href,
            label: label.slice(0, 160) || undefined,
            group: groupLabel?.trim().slice(0, 100) || undefined,
          },
        ];
      }),
    { hidden, previouslyVisible, remember }
  );
}

async function headerRoots(page: Page) {
  const landmarks = await page
    .locator(headerSelector)
    .filter({ visible: true })
    .all();
  const roots = [];
  for (const landmark of landmarks) {
    const global = await landmark.evaluate((element) => {
      const main = element.closest("main, [role=main]");
      if (!main) return true;
      // Some sites wrap the whole page, including its global header, in main.
      const heading = main.querySelector("h1");
      const { top, width, height } = element.getBoundingClientRect();
      return Boolean(
        heading &&
        element.compareDocumentPosition(heading) &
          Node.DOCUMENT_POSITION_FOLLOWING &&
        !element.contains(heading) &&
        top < 160 &&
        width >= innerWidth * 0.8 &&
        height <= 260 &&
        element.querySelectorAll("a[href], button, [role=button]").length > 1
      );
    });
    if (global) roots.push(landmark);
    if (roots.length === 4) break;
  }
  if (roots.length) return roots;
  // Search navigation and its wrappers for custom headers that render inside main.
  const navigation = page
    .locator(
      `${navigationSelector}, [id*="header" i], [class*="header" i], [data-testid*="header" i]`
    )
    .or(page.getByRole("button", { name: menuLabel }))
    .filter({ visible: true })
    .locator(
      "xpath=ancestor-or-self::*[self::div or self::section or self::nav]"
    );
  for (const candidate of (await navigation.all()).slice(0, 40)) {
    const top = await candidate.evaluate((element) => {
      const content =
        document.querySelector("h1") ??
        document.querySelector("main, [role=main]");
      const { top, bottom, width, height } = element.getBoundingClientRect();
      if (
        element.closest("footer, [role=contentinfo]") ||
        top < -1 ||
        top >= 160 ||
        bottom > 260 ||
        width < innerWidth * 0.8 ||
        height < 20 ||
        (content &&
          (element.contains(content) ||
            !(
              element.compareDocumentPosition(content) &
              Node.DOCUMENT_POSITION_FOLLOWING
            )))
      )
        return false;
      return (
        [...element.querySelectorAll("a[href], button, [role=button]")].filter(
          (control) => {
            const rect = control.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom > 0 &&
              control.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
              })
            );
          }
        ).length > 1
      );
    });
    if (top) return [candidate];
  }
  return [];
}

async function chromeScreenshot(page: Page, roots: Locator[]) {
  const viewport = page.viewportSize()!;
  const boxes = (
    await Promise.all(roots.map((root) => root.boundingBox()))
  ).filter(
    (box): box is Rect =>
      box !== null && box.y < viewport.height && box.y + box.height > 0
  );
  if (!boxes.length) return;
  const y = Math.max(0, Math.floor(Math.min(...boxes.map((box) => box.y))));
  const bottom = Math.min(
    viewport.height,
    Math.ceil(Math.max(...boxes.map((box) => box.y + box.height)))
  );
  return page.screenshot({
    type: "jpeg",
    quality: 72,
    animations: "disabled",
    clip: { x: 0, y, width: viewport.width, height: bottom - y },
    timeout: 4_000,
  });
}

async function linkStyle(link: Locator) {
  return link.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      textDecoration: style.textDecorationLine,
      outline: style.outlineStyle === "none" ? "none" : style.outline,
      outlineOffset: style.outlineOffset,
      focusVisible: element.matches(":focus-visible"),
    };
  });
}

async function waitForLinkStyles(link: Locator) {
  await link.evaluate(
    async (element) => {
      const transitions = element
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition);
      if (transitions.length)
        await Promise.race([
          Promise.allSettled(transitions.map(({ finished }) => finished)),
          new Promise((resolve) => setTimeout(resolve, 250)),
        ]);
    },
    undefined,
    { timeout: 750 }
  );
}

async function sampleLinks(
  page: Page,
  roots: Locator[],
  hover: boolean,
  limit: number
) {
  const samples = [];
  for (const root of roots) {
    const links = root.locator("a[href]").filter({ visible: true });
    for (const link of (await links.all()).slice(0, 12)) {
      const identity = await link.evaluate((element: HTMLAnchorElement) => ({
        href: element.href,
        label: (
          element.innerText.trim() ||
          element.getAttribute("aria-label") ||
          ""
        ).slice(0, 100),
      }));
      if (!identity.label || !/^https?:/.test(identity.href)) continue;
      const sample: {
        label: string;
        href: string;
        rest: Awaited<ReturnType<typeof linkStyle>>;
        hover?: Awaited<ReturnType<typeof linkStyle>>;
        focus?: Awaited<ReturnType<typeof linkStyle>>;
        unavailable: string[];
      } = { ...identity, rest: await linkStyle(link), unavailable: [] };
      try {
        if (hover) {
          await link.hover({ timeout: 750 });
          await waitForLinkStyles(link);
          sample.hover = await linkStyle(link);
        } else {
          await link.hover({ trial: true, timeout: 750 });
        }
      } catch {
        sample.unavailable.push(
          hover ? "hover obstructed or link moved" : "link obstructed or moved"
        );
      }
      await page.mouse.move(0, 0);
      if (!sample.unavailable.length) {
        // Keyboard input establishes the focus-visible modality without activating a link.
        await page.keyboard.press("Tab");
        await link.focus({ timeout: 750 }).catch(() => {});
        await waitForLinkStyles(link).catch(() => {});
        const focus = await linkStyle(link);
        if (focus.focusVisible) sample.focus = focus;
        else sample.unavailable.push("keyboard focus could not be observed");
        await link.evaluate((element: HTMLElement) => element.blur());
      } else {
        sample.unavailable.push(
          "keyboard focus not sampled on obstructed link"
        );
      }
      samples.push(sample);
      if (samples.length >= limit) return samples;
    }
  }
  return samples;
}

async function waitForDisclosureLinks(
  read: () => ReturnType<typeof readLinks>
) {
  const deadline = performance.now() + 1_200;
  let links = await read();
  let signature = JSON.stringify(links);
  let stableSince = performance.now();
  while (performance.now() < deadline) {
    if (links.length && performance.now() - stableSince >= 150) break;
    await new Promise((done) => setTimeout(done, 50));
    links = await read();
    const nextSignature = JSON.stringify(links);
    if (nextSignature !== signature) {
      signature = nextSignature;
      stableSince = performance.now();
    }
  }
  return links;
}

async function sampleDisclosures(
  page: Page,
  roots: Locator[],
  region: "header" | "footer",
  hover: boolean
) {
  const samples = [];
  let expandedScreenshot: Buffer | undefined;
  for (const root of roots) {
    const disclosures = root.locator(
      region === "footer"
        ? "details > summary:first-child, button, [role=button], a[aria-expanded]"
        : "details > summary:first-child, :is(button, [role=button], a)[aria-expanded]"
    );
    const controls = (
      region === "header"
        ? disclosures.or(
            root.getByRole("button", {
              name: menuLabel,
            })
          )
        : disclosures
    ).filter({ visible: true });
    for (const control of (await controls.all()).slice(
      0,
      region === "header" ? 16 : 14
    )) {
      const state = await control.evaluate((element) => {
        const details = element.matches("summary")
          ? element.closest("details")
          : null;
        const label = (
          element.getAttribute("aria-label") ||
          (element as HTMLElement).innerText ||
          element.getAttribute("title") ||
          element.querySelector("img[alt]")?.getAttribute("alt") ||
          element.querySelector("svg title")?.textContent ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim();
        return {
          label: label.slice(0, 140),
          native: Boolean(details),
          open:
            details?.open ?? element.getAttribute("aria-expanded") === "true",
          controls: element
            .getAttribute("aria-controls")
            ?.trim()
            .split(/\s+/)[0],
          inForm: Boolean(element.closest("form")),
          hasExpanded:
            Boolean(details) || element.hasAttribute("aria-expanded"),
          adjacentLinks: Boolean(
            element.nextElementSibling?.querySelector("a[href]")
          ),
        };
      });
      if (
        state.inForm ||
        /\b(search|cart|bag|sign[ -]?in|log[ -]?in|checkout|order (?:now|online|pickup))\b/i.test(
          region === "header" ? state.label : ""
        ) ||
        (region === "footer" &&
          !state.native &&
          !state.controls &&
          !state.adjacentLinks)
      )
        continue;
      const panel = state.native
        ? control.locator("..")
        : state.controls
          ? page.locator(`[id=${JSON.stringify(state.controls)}]`).first()
          : state.adjacentLinks
            ? control.locator("xpath=following-sibling::*[1]")
            : root;
      const expanded = state.native
        ? panel.and(page.locator("details[open]"))
        : control.and(page.locator('[aria-expanded="true"]'));
      const linkScope =
        panel === root && region === "header" ? page.locator("body") : panel;
      const previouslyVisible = await page.evaluateHandle(
        () => new WeakSet<HTMLAnchorElement>()
      );
      const revealedLinks = () => readLinks(linkScope, { previouslyVisible });
      // A no-content response leaves the source document loaded in Chromium.
      const stopNavigation = (route: Route) =>
        route.request().isNavigationRequest()
          ? route.fulfill({ status: 204 })
          : route.fallback();
      const context = page.context();
      let clicked = false;
      let hovered = false;
      try {
        await readLinks(linkScope, { previouslyVisible, remember: true });
        // Even a button with aria-expanded can have a fallback destination.
        await context.route("**/*", stopNavigation);
        if (!state.open && !state.native && region === "header" && hover) {
          await control.hover({ timeout: 750 });
          hovered = true;
          await expanded
            .waitFor({ state: "visible", timeout: 400 })
            .catch(() => {});
        }
        if (
          !state.open &&
          !(await expanded.isVisible()) &&
          !(await revealedLinks()).length
        ) {
          await control.click({ timeout: 900, noWaitAfter: true });
          clicked = true;
        }
        const links = await waitForDisclosureLinks(
          panel === root && !state.open ? revealedLinks : () => readLinks(panel)
        );
        if (!(await expanded.isVisible()) && !links.length)
          throw new Error("No open panel or newly visible links");
        const content = await readRegion(panel);
        samples.push({
          label: state.label,
          content,
          links,
          ...(links.length
            ? {}
            : {
                unavailable:
                  "No visible navigation links appeared after expansion",
              }),
        });
        if (region === "header" && links.length && !expandedScreenshot) {
          expandedScreenshot =
            (panel === root
              ? undefined
              : await chromeScreenshot(page, [root, panel]).catch(
                  () => undefined
                )) ??
            (await page
              .screenshot({
                type: "jpeg",
                quality: 72,
                animations: "disabled",
                timeout: 4_000,
              })
              .catch(() => undefined));
        }
      } catch {
        samples.push({
          label: state.label,
          unavailable:
            "control obstructed or expanded content did not become observable",
        });
      } finally {
        try {
          if (clicked) {
            await page.keyboard.press("Escape").catch(() => {});
            const close = page
              .getByRole("button", {
                name: /^close (?:mobile )?(?:menu|navigation)$/i,
              })
              .filter({ visible: true })
              .first();
            if (region === "header" && (await close.count()))
              await close
                .click({ timeout: 750, noWaitAfter: true })
                .catch(() => {});
            else if (
              (await expanded.isVisible()) ||
              (!state.hasExpanded &&
                (await revealedLinks().catch(() => [])).length)
            )
              await control
                .click({ timeout: 750, noWaitAfter: true })
                .catch(() => {});
          }
          if (hovered) await page.mouse.move(0, 0);
        } finally {
          await context.unroute("**/*", stopNavigation);
          await previouslyVisible.dispose();
        }
      }
    }
  }
  return { samples, expandedScreenshot };
}

async function headerPositions(roots: Locator[]) {
  return Promise.all(
    roots.map((root) =>
      root
        .evaluate(
          (element) => {
            const pinned = Array.from(element.querySelectorAll("*")).flatMap(
              (child) => {
                const { position } = getComputedStyle(child);
                if (
                  !["sticky", "fixed"].includes(position) ||
                  !child.checkVisibility()
                )
                  return [];
                const { y, height } = child.getBoundingClientRect();
                return [
                  {
                    tag: child.tagName.toLowerCase(),
                    position,
                    y: Math.round(y),
                    height: Math.round(height),
                  },
                ];
              }
            );
            return {
              y: Math.round(element.getBoundingClientRect().y),
              pinned: pinned.slice(0, 8),
            };
          },
          undefined,
          { timeout: 1_000 }
        )
        .catch(() => undefined)
    )
  );
}

async function hasVisibleModal(page: Page) {
  return (
    (await page
      .locator('dialog[open], [role="dialog"][aria-modal="true"]')
      .filter({ visible: true })
      .count()) > 0
  );
}

export async function captureHeader(
  page: Page,
  hover: boolean,
  sampleInteractions: boolean
) {
  let roots = await headerRoots(page);
  // Location content can render before a separate global navigation hydrates.
  const deadline = Date.now() + 5_000;
  while (!roots.length && Date.now() < deadline) {
    await new Promise((done) => setTimeout(done, 250));
    roots = await headerRoots(page);
  }
  const notes: string[] = [];
  if (await hasVisibleModal(page))
    notes.push("A modal overlay was visible during header capture.");
  if (!roots.length) {
    notes.push(
      "No visible global header landmark or top navigation was identified."
    );
    return { data: { notes } };
  }
  const rows = (await Promise.all(roots.map(readRegion))).filter(Boolean);
  const links = (
    await Promise.all(roots.map((root) => readLinks(root)))
  ).flat();
  const top = await headerPositions(roots);
  const screenshot = await chromeScreenshot(page, roots).catch(() => undefined);
  if (!screenshot) notes.push("Header screenshot unavailable.");
  const scrolledTo = await page.evaluate(() => {
    window.scrollTo({ top: innerHeight, behavior: "instant" });
    return scrollY;
  });
  const scrolled = await headerPositions(roots);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const linkStates = sampleInteractions
    ? await sampleLinks(page, roots, hover, 4)
    : [];
  const { samples: disclosures, expandedScreenshot } = sampleInteractions
    ? await sampleDisclosures(page, roots, "header", hover)
    : { samples: [], expandedScreenshot: undefined };
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return {
    data: {
      rows,
      links,
      linkStates,
      disclosures,
      stickySample: {
        scrolledTo,
        top,
        scrolled,
      },
      notes,
    },
    screenshot,
    expandedScreenshot,
  };
}

export async function captureFooter(
  page: Page,
  footer: Locator,
  hover: boolean,
  sampleInteractions: boolean
) {
  if (!(await footer.count())) {
    return {
      notes: ["No visible global footer could be identified after scrolling."],
    };
  }
  try {
    await footer.scrollIntoViewIfNeeded({ timeout: 4_000 });
  } catch {
    return {
      notes: [
        "The footer was identified but moved or was unavailable when scrolled into view.",
      ],
    };
  }
  const tree = await readRegion(footer);
  const [links, hiddenLinks] = await Promise.all([
    readLinks(footer),
    readLinks(footer, { hidden: true }),
  ]);
  const notes: string[] = [];
  if (await hasVisibleModal(page))
    notes.push("A modal overlay was visible during footer capture.");
  const screenshot = await footer
    .screenshot({
      type: "jpeg",
      quality: 72,
      animations: "disabled",
      timeout: 4_000,
    })
    .catch(() => undefined);
  const linkStates = sampleInteractions
    ? await sampleLinks(page, [footer], hover, 3)
    : [];
  const disclosures = sampleInteractions
    ? (await sampleDisclosures(page, [footer], "footer", hover)).samples
    : [];
  if (!screenshot) notes.push("Footer screenshot unavailable.");
  return {
    tree,
    links,
    hiddenLinks,
    screenshot,
    linkStates,
    disclosures,
    notes,
  };
}
