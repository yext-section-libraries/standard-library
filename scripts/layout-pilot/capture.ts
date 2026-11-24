import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";

const exec = promisify(execFile);
const footerLandmarks =
  "footer, [role=contentinfo], #footer, .site-footer, [class~='footer' i], [data-testid='footer' i], nav[aria-label*='footer' i]";
const footerSelector = `:is(${footerLandmarks}):not(article *, :is(${footerLandmarks}) *)`;
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string) => {
    window: { document: Document; close(): void };
  };
};

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes("Executable doesn't exist")
    ) {
      throw error;
    }
    return chromium.launch({ channel: "chrome" });
  }
}

export async function capturePage(url: URL, scratch: string) {
  const browser = await launchBrowser();
  try {
    const captures = [];
    for (const [name, width, height] of [
      ["desktop", 1440, 1000],
      ["mobile", 390, 844],
    ] as const) {
      const started = performance.now();
      const page = await browser.newPage({ viewport: { width, height } });
      try {
        const response = await page.goto(url.href, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        if (!response?.ok()) {
          throw new Error(
            `${name} page navigation returned ${response?.status() ?? "no response"}`
          );
        }
        await page.waitForLoadState("load", { timeout: 5_000 }).catch(() => {});
        try {
          await page.waitForFunction(
            () => {
              const main =
                document.querySelector("main, [role=main]") ?? document.body;
              if (main.getAttribute("aria-busy") === "true") return false;
              const text = new Set<string>();
              for (const block of main.querySelectorAll<HTMLElement>(
                "h1, h2, h3, h4, h5, h6, [role=heading], p, address, a[href^='tel:']"
              )) {
                if (
                  block.closest(
                    "header, nav, footer, [role=status], [role=progressbar], dialog"
                  ) ||
                  !block.checkVisibility({
                    visibilityProperty: true,
                    opacityProperty: true,
                  })
                )
                  continue;
                const value = block.innerText?.trim();
                if (!value || /^(?:loading|please wait)[.!…\s]*$/i.test(value))
                  continue;
                if (block.matches("address, a[href^='tel:']")) return true;
                text.add(value);
                if (text.size >= 2) return true;
              }
              return false;
            },
            undefined,
            { timeout: 40_000, polling: 200 }
          );
        } catch (error) {
          throw new Error(
            `${name} page did not finish loading visible location content`,
            { cause: error }
          );
        }
        const footer = page
          .locator(footerSelector)
          .filter({ visible: true })
          .last();
        // Some sites mount their global footer only when the bottom enters view.
        if (!(await footer.count())) {
          await page.evaluate(() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "instant",
            })
          );
          await footer
            .waitFor({ state: "visible", timeout: 3_000 })
            .catch(() => {});
          await page.evaluate(() =>
            window.scrollTo({ top: 0, behavior: "instant" })
          );
        }
        await page.evaluate(() =>
          Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 2_000)),
          ])
        );
        const inventory = await page.evaluate((footerSelector) => {
          const linkSamples = new Map<
            string,
            {
              role: string;
              region: string;
              font: Record<string, string>;
              count: number;
              examples: string[];
            }
          >();
          for (const link of document.querySelectorAll<HTMLAnchorElement>(
            "a[href]"
          )) {
            const label = link.innerText.trim();
            if (
              !label ||
              !link.checkVisibility({
                visibilityProperty: true,
                opacityProperty: true,
              }) ||
              link.closest("button, [role=button]") ||
              /(?:^|[\s_-])(?:button|btn|cta)(?:$|[\s_-])/i.test(link.className)
            )
              continue;
            const region = link.closest(footerSelector)
              ? "footer"
              : link.closest("header, [role=banner]")
                ? "header"
                : "body";
            const role =
              region === "header" ||
              link.closest("nav, [role=navigation]") ||
              (region === "footer" && link.closest("li"))
                ? "navigation-link"
                : "link";
            const style = getComputedStyle(link);
            const font = {
              family: style.fontFamily,
              size: style.fontSize,
              weight: style.fontWeight,
              style: style.fontStyle,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              textTransform: style.textTransform,
            };
            const key = JSON.stringify([region, role, font]);
            const sample = linkSamples.get(key) ?? {
              role,
              region,
              font,
              count: 0,
              examples: [] as string[],
            };
            sample.count++;
            if (sample.examples.length < 3)
              sample.examples.push(label.slice(0, 100));
            linkSamples.set(key, sample);
          }
          const samples = [...linkSamples.values()].sort(
            (a, b) => b.count - a.count
          );
          const entries = [];
          const elements = document.querySelectorAll(
            "header, nav, main, section, article, footer, h1, h2, h3, h4, h5, h6, p, address, li, a[href], button, img, summary, iframe, [role=heading], [role=button], [style*=background]"
          );
          for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (
              !rect.width ||
              !rect.height ||
              !element.checkVisibility({
                visibilityProperty: true,
                opacityProperty: true,
              })
            )
              continue;

            const tag = element.tagName.toLowerCase();
            const structural = [
              "header",
              "nav",
              "main",
              "section",
              "article",
              "footer",
            ].includes(tag);
            const style = getComputedStyle(element);
            const text = structural
              ? ""
              : ((element as HTMLElement).innerText
                  ?.replace(/\s+/g, " ")
                  .trim() ?? "");
            const href =
              element instanceof HTMLAnchorElement ? element.href : undefined;
            const src =
              element instanceof HTMLImageElement
                ? element.currentSrc || element.src
                : element instanceof HTMLIFrameElement
                  ? element.src
                  : undefined;
            const background = style.backgroundImage.includes("data:")
              ? undefined
              : style.backgroundImage;
            if (
              !structural &&
              !text &&
              !href &&
              !src &&
              (!background || background === "none")
            )
              continue;
            entries.push({
              tag,
              text: text.slice(0, 750) || undefined,
              label: element.getAttribute("aria-label") ?? undefined,
              href,
              src: src?.startsWith("data:") ? undefined : src,
              alt: element.getAttribute("alt") ?? undefined,
              bounds: [
                rect.x,
                rect.y + window.scrollY,
                rect.width,
                rect.height,
              ].map(Math.round),
              style: {
                display: style.display,
                position: style.position,
                color: style.color,
                backgroundColor: style.backgroundColor,
                background: background === "none" ? undefined : background,
                font: text
                  ? [
                      style.fontFamily,
                      style.fontSize,
                      style.fontWeight,
                      style.lineHeight,
                    ]
                  : undefined,
                columns:
                  style.gridTemplateColumns === "none"
                    ? undefined
                    : style.gridTemplateColumns,
                gap: style.gap === "normal" ? undefined : style.gap,
                overflowX: style.overflowX,
              },
            });
          }
          return {
            title: document.title,
            count: entries.length,
            entries: entries.slice(0, 350),
            linkTypography: ["header", "body", "footer"].flatMap((region) =>
              samples.filter((sample) => sample.region === region).slice(0, 8)
            ),
          };
        }, footerSelector);
        if (!inventory.entries.length)
          throw new Error(`${name} capture contains no visible page content`);
        const documentHeight = await page.evaluate(
          () => document.documentElement.scrollHeight
        );
        const screenshot = await page.screenshot({
          type: "jpeg",
          quality: 80,
          animations: "disabled",
          fullPage: true,
          clip: { x: 0, y: 0, width, height: Math.min(documentHeight, 3_000) },
          path: join(scratch, `${name}.jpg`),
        });
        let footerData;
        let footerScreenshot;
        if (await footer.count()) {
          await footer.scrollIntoViewIfNeeded();
          footerData = await footer.evaluate((root) => {
            type Item = {
              tag: string;
              label?: string;
              text?: string;
              href?: string;
              src?: string;
              open?: boolean;
              style?: string[];
              children?: Item[];
            };
            const tree = {
              visit(element: Element): Item[] {
                if (
                  element.matches("script, style, svg") ||
                  (element !== root &&
                    !element.checkVisibility({
                      checkOpacity: true,
                      checkVisibilityCSS: true,
                    }) &&
                    getComputedStyle(element).display !== "contents")
                )
                  return [];
                const tag = element.tagName.toLowerCase();
                const href =
                  element instanceof HTMLAnchorElement
                    ? element.href
                    : undefined;
                const src =
                  element instanceof HTMLImageElement
                    ? element.currentSrc || element.src || element.dataset.src
                    : undefined;
                const label =
                  element.getAttribute("aria-label") ??
                  element.getAttribute("alt") ??
                  element.getAttribute("title") ??
                  (href
                    ? element.querySelector("svg title")?.textContent
                    : undefined) ??
                  undefined;
                const text = (
                  element.matches(
                    "a, button, summary, h1, h2, h3, h4, h5, h6, [role=heading]"
                  )
                    ? (element as HTMLElement).innerText
                    : [...element.childNodes]
                        .filter((node) => node.nodeType === Node.TEXT_NODE)
                        .map((node) => node.textContent)
                        .join(" ")
                )
                  ?.replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 750);
                const children = [...element.children].flatMap((child) =>
                  tree.visit(child)
                );
                const style = getComputedStyle(element);
                const open =
                  element instanceof HTMLDetailsElement
                    ? element.open
                    : undefined;
                const group =
                  element === root ||
                  children.length > 1 ||
                  element.matches(
                    "nav, section, ul, ol, details, [role=navigation]"
                  );
                if (!group && !href && !src && !label && !text) return children;
                return [
                  {
                    tag,
                    href,
                    src: src?.startsWith("data:") ? undefined : src,
                    label,
                    text: text || undefined,
                    open,
                    style: group
                      ? [
                          style.display,
                          style.backgroundColor,
                          style.gridTemplateColumns,
                          style.flexDirection,
                          style.gap,
                          style.padding,
                        ]
                      : undefined,
                    children: children.length ? children : undefined,
                  },
                ];
              },
            };
            return tree.visit(root)[0];
          });
          footerScreenshot = await footer.screenshot({
            type: "jpeg",
            quality: 72,
            animations: "disabled",
            timeout: 15_000,
            path: join(scratch, `${name}-footer.jpg`),
          });
        }
        const data = {
          name,
          width,
          height,
          finalUrl: page.url(),
          ...inventory,
          footer: footerData,
        };
        await writeFile(join(scratch, `${name}.json`), JSON.stringify(data));
        captures.push({
          data,
          screenshot,
          footerScreenshot,
          elapsedMs: Math.round(performance.now() - started),
        });
      } finally {
        await page.close();
      }
    }
    return captures;
  } finally {
    await browser.close();
  }
}

export async function extractGuide(url: URL, brand: string, scratch: string) {
  const scratchTemp = join(scratch, "tmp");
  await mkdir(scratchTemp);
  const env = Object.fromEntries(
    [
      "PATH",
      "HOME",
      "SystemRoot",
      "PLAYWRIGHT_BROWSERS_PATH",
      "HTTP_PROXY",
      "HTTPS_PROXY",
      "NO_PROXY",
      "http_proxy",
      "https_proxy",
      "no_proxy",
    ].map((key) => [key, process.env[key]])
  );
  const guidePath = join(scratch, `${brand}.brand.html`);
  await exec(
    "npx",
    [
      "--yes",
      "designlang@13.4.1",
      "brand",
      url.href,
      "--out",
      scratch,
      "--name",
      `${brand}.brand`,
      "--format",
      "html",
    ],
    {
      cwd: scratch,
      env: {
        ...env,
        TMPDIR: scratchTemp,
        npm_config_cache: join(scratch, "npm-cache"),
      },
      timeout: 180_000,
      maxBuffer: 1024 * 1024,
    }
  ).catch((error: NodeJS.ErrnoException & { stderr?: string }) => {
    throw new Error(
      `Designlang failed: ${error.stderr?.trim().slice(-1_500) || error.message}`
    );
  });
  let html: string;
  try {
    html = await readFile(guidePath, "utf8");
  } catch (error) {
    throw new Error("Designlang did not produce the expected HTML guide", {
      cause: error,
    });
  }
  const { window } = new JSDOM(html);
  try {
    const { document } = window;
    document
      .querySelectorAll("script, style, svg, nav")
      .forEach((element) => element.remove());
    const designSections = [...document.querySelectorAll("h2")].filter(
      (heading) =>
        /^(colou?r|typography|spacing|shape|components|iconography)$/i.test(
          heading.textContent?.trim() ?? ""
        )
    );
    if (!designSections.length)
      throw new Error(
        "Designlang HTML contains no recognizable design sections"
      );
    return designSections
      .map((heading) =>
        (heading.closest("section") ?? heading.parentElement)?.textContent
          ?.replace(/\s+/g, " ")
          .trim()
          .slice(0, 12_000)
      )
      .filter(Boolean)
      .join("\n");
  } finally {
    window.close();
  }
}
