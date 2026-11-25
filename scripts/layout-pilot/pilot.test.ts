import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runPilot } from "./cli.ts";
import { applyRepair, type Draft, type RepairIssue } from "./gateway.ts";

const validDraft: Draft = {
  displayName: "Fixture Coffee",
  nodes: [
    {
      key: "box",
      type: "Box",
      parentKey: null,
      slot: null,
      propsJson: JSON.stringify({
        as: "section",
        surface: { backgroundColor: "rgb(18, 52, 86)", borderColor: "#abc" },
        states: { hover: { surface: { backgroundColor: "#123456" } } },
      }),
    },
    {
      key: "heading",
      type: "Heading",
      parentKey: "box",
      slot: "content",
      propsJson: JSON.stringify({
        as: "h1",
        typographyRole: "headline",
        data: { text: { field: "name", constantValueEnabled: false } },
      }),
    },
    {
      key: "city",
      type: "Paragraph",
      parentKey: "box",
      slot: "content",
      propsJson:
        '{"data":{"text":{"field":"address.city","constantValueEnabled":false}}}',
    },
    {
      key: "faq",
      type: "FAQSection",
      parentKey: null,
      slot: null,
      propsJson: "{}",
    },
  ],
  themeOverrides: [
    { key: "colorPrimary", value: "#123456" },
    { key: "linkFontFamily", value: "Lato, sans-serif" },
  ],
  omissions: ["Store number"],
  themeSubstitutions: ["Used a fallback font"],
};

const completed = (draft: Draft | Parameters<typeof applyRepair>[1]) => ({
  id: "resp_fixture",
  status: "completed",
  usage: {
    input_tokens: 100,
    output_tokens: 40,
    total_tokens: 140,
    input_tokens_details: { cached_tokens: 20 },
    output_tokens_details: { reasoning_tokens: 10 },
  },
  output: [
    { type: "reasoning" },
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(draft) }],
    },
  ],
});
const disconnect = Symbol("disconnect");

test("layout pilot", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "layout-pilot-test-"));
  const previousPath = process.env.PATH;
  const requests: Record<string, any>[] = [];
  const requestHeaders: import("node:http").IncomingHttpHeaders[] = [];
  let replies: unknown[] = [];
  let fallbackNavigation = false;
  const server = createServer(async (request, response) => {
    if (request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(chunk);
      requests.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      requestHeaders.push(request.headers);
      const reply = replies.shift();
      if (reply === disconnect) {
        request.socket.destroy();
        return;
      }
      response.writeHead(reply ? 200 : 500, {
        "Content-Type": "application/json",
        "X-Request-Id": `request-${requests.length}`,
      });
      response.end(JSON.stringify(reply ?? { error: "Unexpected request" }));
      return;
    }
    if (request.url === "/menu-fallback") fallbackNavigation = true;
    response.writeHead(200, { "Content-Type": "text/html" });
    const loaded = `<section><h1>Fixture Coffee</h1><p>Open daily. <a href="/details">Details</a></p><p class="mobile">Mobile only</p>${"<p>More copy</p>".repeat(360)}</section>`;
    const footer = `<footer><nav aria-label="Company"><h2>Company</h2><ul><li><a href="/jobs">Careers</a></li></ul></nav>
      <details><summary>Policies</summary><a href="/privacy">Privacy</a></details>
      <a href="/social" aria-label="Follow us"></a><p>All rights reserved.</p>
      <button onclick="const panel = this.nextElementSibling; panel.hidden = !panel.hidden">Support</button>
      <div hidden><a href="/help">Help center</a></div>
      ${"<span></span>".repeat(310)}<a href="/terms">Terms of use</a></footer>`;
    const main =
      request.url === "/loading"
        ? `<p role="status">Loading…</p><script>
          setTimeout(() => {
            document.getElementById("fixture-content").innerHTML = ${JSON.stringify(loaded + '<div id="footer-sentinel" style="height:1px"></div>')};
            const sentinel = document.getElementById("footer-sentinel");
            const observer = new IntersectionObserver(([entry]) => {
              if (!entry.isIntersecting) return;
              sentinel.insertAdjacentHTML("afterend", ${JSON.stringify(footer)});
              observer.disconnect();
            });
            observer.observe(sentinel);
          }, 600);
        </script>`
        : loaded + footer;
    const menu =
      request.url === "/loading"
        ? `<a href="/menu-fallback" aria-controls="desktop-menu" aria-expanded="false" class="desktop"
          onclick="event.preventDefault(); const existing = document.getElementById('desktop-menu'); this.setAttribute('aria-expanded', String(!existing)); if (existing) { existing.remove(); return; } const panel = document.createElement('nav'); panel.id = 'desktop-menu'; panel.style.minHeight = '30px'; this.after(panel); setTimeout(() => panel.innerHTML = '<a href=/tea>Tea</a>', 350); setTimeout(() => panel.insertAdjacentHTML('beforeend', '<a href=/mugs>Mugs</a>'), 425)">Products</a>
        <button class="desktop" aria-expanded="false" onclick="location.href='/menu-fallback'">More products</button>
        <button class="mobile" aria-expanded="false" onclick="const panel = document.getElementById('mobile-menu'); this.setAttribute('aria-expanded', String(panel.classList.toggle('open')))">Toggle Header Menu</button>
        <button class="mobile" aria-expanded="false" onclick="const panel = document.getElementById('bottom-menu'); this.setAttribute('aria-expanded', String(panel.classList.toggle('open')))">Quick links</button>`
        : request.url === "/client-route"
          ? `<button aria-expanded="false" onclick="history.pushState({}, '', '/other-location'); document.querySelector('footer').innerHTML = '<a href=&quot;/other-careers&quot;>Other careers</a>'">Menu</button>`
          : "";
    const header = `<header><a href="/menu">Menu</a>${menu}</header>`;
    const body =
      request.url === "/loading"
        ? `<main>${header}<nav id="mobile-menu"><a href="/coffee-beans">Coffee beans</a><a href="/details">Details</a></nav><nav id="bottom-menu"><a href="/hours">Hours</a></nav><div id="fixture-content">${main}</div></main>`
        : request.url === "/late-header"
          ? `<main><div id="header-shell" style="height:80px"></div>${main}
            <script>setTimeout(() => {
              document.getElementById("header-shell").innerHTML =
                '<nav aria-label="Global"><a href="/menu">Menu</a> <a href="/locations">Locations</a></nav>';
            }, 2800)</script></main>`
          : `${header}<main>${main}</main>`;
    response.end(`<!doctype html><html><head><title>Fixture Coffee</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body {background: white} .mobile {display:none}
        header a {font: 700 22px Arial} main section a {font: 400 14px Georgia}
        #mobile-menu, #bottom-menu { display: none; }
        @media(max-width:600px) {
          #mobile-menu { display:block; position:absolute; left:0; width:100%; height:200px; background:yellow; transform:translateX(-100%); transition:transform 160ms; }
          #bottom-menu { display:block; position:fixed; bottom:0; width:100%; background:white; transform:translateY(100%); transition:transform 160ms; }
          #mobile-menu.open, #bottom-menu.open { transform:none; }
        }
        @media(max-width:600px) { .mobile {display:block} .desktop {display:none} header a {font-size:17px} }</style></head>
      <body>${body}</body></html>`);
  });
  t.after(async () => {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  });
  await writeFile(
    join(directory, "npx"),
    `#!${process.execPath}
const assert = require("node:assert/strict");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");
const args = process.argv.slice(2);
assert.deepEqual(args.slice(0,3), ["--yes", "designlang@13.4.1", "brand"]);
if (!args[3].endsWith("/missing-guide")) {
  writeFileSync(join(args[5], args[7] + ".html"),
    "<html><section><h2>Colour</h2><p>Deep navy #123456</p></section></html>");
}
`,
    { mode: 0o755 }
  );
  process.env.PATH = `${directory}:${previousPath ?? ""}`;
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  const logs: string[] = [];
  const logPath = (name: string) =>
    join(directory, "logs", `${name.replaceAll("/", "-")}.log.txt`);
  const run = (name: string, path = "/coffee", extraArgs: string[] = []) =>
    runPilot(
      [
        origin + path,
        "--brand",
        "fixture",
        "--out",
        join(directory, name),
        "--log-file",
        logPath(name),
        ...extraArgs,
      ],
      {
        endpoint: origin + "/responses",
        model: "gpt-6.2-sol",
        apiKey: "fixture-secret",
        log: (line) => logs.push(line),
      }
    );

  await t.test(
    "captures both breakpoints and exports exactly three files",
    async () => {
      replies = [completed(validDraft)];
      const target = await run("nested/success", "/loading");
      assert(target);
      const request = requests.at(-1)!;
      assert.equal(request.model, "gpt-6.2-sol");
      assert.deepEqual(request.reasoning, { effort: "high" });
      assert.equal(request.text.format.type, "json_schema");
      assert.equal(request.text.format.strict, true);
      const headers = requestHeaders.at(-1)!;
      assert.equal(headers["yext-source"], "vle-layout-json-pilot");
      assert.match(headers["yext-business-id"] as string, /^\d+$/);
      assert.match(headers["correlation-id"] as string, /^[a-f0-9-]{36}$/);
      const [text, ...attachments] = request.input[0].content;
      const images = attachments.filter(
        (item: { type: string }) => item.type === "input_image"
      );
      assert.equal(images.length, 8);
      assert(
        attachments.some(
          (item: { text?: string }) =>
            item.text === "Source screenshot: mobile footer"
        )
      );
      assert(
        images.every(
          (image: { type: string; image_url: string }) =>
            image.type === "input_image" &&
            image.image_url.startsWith("data:image/jpeg;base64,")
        )
      );
      const evidence = JSON.parse(text.text);
      assert.match(evidence.guide, /Deep navy/);
      assert.deepEqual(
        evidence.captures.map((capture: { width: number }) => capture.width),
        [1440, 390]
      );
      assert(!JSON.stringify(evidence.captures[0]).includes("Mobile only"));
      assert(JSON.stringify(evidence.captures[1]).includes("Mobile only"));
      assert(JSON.stringify(evidence.captures[0]).includes("Open daily"));
      assert(!JSON.stringify(evidence.captures).includes("Loading…"));
      const [desktop, mobile] = evidence.captures;
      assert(!JSON.stringify(desktop.entries).includes("Careers"));
      assert.match(
        JSON.stringify(desktop.footer),
        /Company.*Careers.*Policies.*rights reserved/
      );
      assert.match(JSON.stringify(mobile.footer), /\/jobs.*Careers/);
      assert(!JSON.stringify(desktop.footer).includes("Terms of use"));
      assert.deepEqual(desktop.footerEvidence.links.at(-1), {
        href: origin + "/terms",
        label: "Terms of use",
      });
      assert.deepEqual(mobile.footerEvidence.hiddenLinks, [
        { href: origin + "/privacy", label: "Privacy", group: "Policies" },
        { href: origin + "/help", label: "Help center" },
      ]);
      assert.deepEqual(mobile.footerEvidence.disclosures[0].links, [
        { href: origin + "/privacy", label: "Privacy", group: "Policies" },
      ]);
      assert.deepEqual(mobile.footerEvidence.disclosures[1].links, [
        { href: origin + "/help", label: "Help center" },
      ]);
      assert.deepEqual(desktop.header.disclosures[0].links, [
        { href: origin + "/tea", label: "Tea" },
        { href: origin + "/mugs", label: "Mugs" },
      ]);
      assert.deepEqual(mobile.header.disclosures[0].links, [
        { href: origin + "/coffee-beans", label: "Coffee beans" },
        { href: origin + "/details", label: "Details" },
      ]);
      assert.deepEqual(mobile.header.disclosures[1].links, [
        { href: origin + "/hours", label: "Hours" },
      ]);
      const expandedMobileImageIndex = attachments.findIndex(
        (item: { text?: string }) =>
          item.text === "Source screenshot: mobile header expanded"
      );
      assert(expandedMobileImageIndex >= 0);
      const jpeg = Buffer.from(
        attachments[expandedMobileImageIndex + 1].image_url.split(",")[1],
        "base64"
      );
      // Chromium encodes these screenshots with a baseline JPEG frame header.
      const frameHeader = jpeg.indexOf(Buffer.of(0xff, 0xc0));
      assert(frameHeader >= 0);
      assert.equal(jpeg.readUInt16BE(frameHeader + 5), mobile.height);
      assert.equal(desktop.header.disclosures[1].label, "More products");
      assert(desktop.header.disclosures[1].unavailable);
      assert.equal(desktop.finalUrl, origin + "/loading");
      assert.equal(fallbackNavigation, false);
      assert.deepEqual(
        evidence.contracts.components.Disclosure.bindingFilters,
        [{ path: ["summary"], types: ["type.string"] }]
      );
      const layoutSchema =
        evidence.contracts.propSchemas[
          evidence.contracts.components.Box.props.layout
        ];
      assert.equal(layoutSchema.additionalProperties, false);
      assert(!Object.hasOwn(layoutSchema.properties, "justifySelf"));
      assert.equal(
        desktop.linkTypography.find(
          (sample: { region: string }) => sample.region === "header"
        ).font.size,
        "22px"
      );
      assert.equal(
        mobile.linkTypography.find(
          (sample: { region: string }) => sample.region === "header"
        ).font.size,
        "17px"
      );
      assert.equal(
        desktop.linkTypography.find(
          (sample: { role: string }) => sample.role === "link"
        ).font.family,
        "Georgia"
      );
      assert.deepEqual((await readdir(target)).sort(), [
        "defaultLayout.json",
        "fixture-theme.json",
        "metadata.json",
      ]);
      const layout = JSON.parse(
        await readFile(join(target, "defaultLayout.json"), "utf8")
      );
      assert(
        layout.root.props.version > 0 &&
          layout.root.props.sectionLibraryMigrationVersion > 0
      );
      assert.equal(layout.root.props.title.field, "name");
      const box = layout.content[0];
      assert.equal(
        box.props.surface.backgroundColor,
        "var(--ve-color-primary)"
      );
      assert.equal(box.props.surface.borderColor, "#abc");
      assert.equal(
        box.props.states.hover.surface.backgroundColor,
        "var(--ve-color-primary)"
      );
      assert.equal(box.props.content[0].props.data.text.field, "name");
      assert.equal(box.props.content[1].props.data.text.field, "address.city");
      assert.notEqual(box.props.id, box.props.content[0].props.id);
      assert.equal(layout.content[1].type, "FAQSection");
      const metadata = JSON.parse(
        await readFile(join(target, "metadata.json"), "utf8")
      );
      assert.deepEqual(metadata, {
        id: "fixture",
        displayName: "Fixture Coffee",
        pageSetType: "ENTITY",
        purpose: ["LOCATION"],
      });
      const theme = JSON.parse(
        await readFile(join(target, "fixture-theme.json"), "utf8")
      );
      assert.equal(theme.colorPrimary, "#123456");
      assert.equal(theme.linkFontFamily, "'Lato', 'Lato Fallback', sans-serif");
      assert.deepEqual(
        Object.keys(theme),
        Object.keys(evidence.contracts.theme)
      );
      assert(logs.some((line) => line.includes("Omitted: Store number")));
      assert(
        logs.some((line) =>
          line.includes("Theme substitution: Used a fallback font")
        )
      );
    }
  );

  await t.test(
    "recaptures the source after client-side navigation",
    async () => {
      replies = [completed(validDraft)];
      const before = requests.length;
      await run("client-route", "/client-route");
      assert.equal(requests.length - before, 1);
      const { captures } = JSON.parse(
        requests.at(-1)!.input[0].content[0].text
      );
      for (const capture of captures) {
        assert.equal(capture.finalUrl, origin + "/client-route");
        assert.deepEqual(capture.header.disclosures, []);
        assert(
          capture.header.notes.includes(
            "The source route changed during capture. Retried without probing controls."
          )
        );
        assert(
          capture.footerEvidence.links.some(
            ({ href }: { href: string }) => href === origin + "/jobs"
          )
        );
        assert(!JSON.stringify(capture).includes("Other careers"));
      }
    }
  );

  await t.test(
    "captures a hydrated custom header and maps product items",
    async () => {
      const draft = structuredClone(validDraft);
      draft.nodes.push(
        {
          key: "products",
          type: "ProductSection",
          parentKey: null,
          slot: null,
          propsJson: "{}",
        },
        {
          key: "cards",
          type: "ProductCardsWrapper",
          parentKey: "products",
          slot: "content",
          propsJson: JSON.stringify({
            data: {
              field: "c_featuredProducts",
              constantValueEnabled: false,
              mappings: {
                description: {
                  field: "description",
                  constantValueEnabled: false,
                },
              },
            },
          }),
        }
      );
      replies = [completed(draft)];
      const target = await run("late-header", "/late-header");
      assert(target);
      const { captures } = JSON.parse(
        requests.at(-1)!.input[0].content[0].text
      );
      for (const { header } of captures)
        assert.deepEqual(
          header.links.map(({ label }: { label: string }) => label),
          ["Menu", "Locations"]
        );
      const { content } = JSON.parse(
        await readFile(join(target, "defaultLayout.json"), "utf8")
      );
      const section = content.find(
        ({ type }: { type: string }) => type === "ProductSection"
      );
      const { mappings } = section.props.content[0].props.data;
      assert.equal(mappings.name.field, "name");
      assert.equal(mappings.image.field, "image");
      assert.equal(mappings.description.field, "description");
    }
  );

  await t.test(
    "repairs an unbounded footer grid and a URL breadcrumb label",
    async () => {
      const draft = structuredClone(validDraft);
      draft.nodes.push(
        {
          key: "footer",
          type: "Box",
          parentKey: null,
          slot: null,
          propsJson: '{"as":"footer"}',
        },
        {
          key: "footer-nav",
          type: "Box",
          parentKey: "footer",
          slot: "content",
          propsJson:
            '{"as":"nav","layout":{"display":"grid","gridTemplateColumns":"max-content max-content"}}',
        },
        {
          key: "footer-links",
          type: "FooterLinksSlot",
          parentKey: "footer-nav",
          slot: "content",
          propsJson: "{}",
        },
        {
          key: "breadcrumbs-section",
          type: "BreadcrumbsSection",
          parentKey: null,
          slot: null,
          propsJson: "{}",
        },
        {
          key: "breadcrumbs",
          type: "Breadcrumbs",
          parentKey: "breadcrumbs-section",
          slot: "content",
          propsJson:
            '{"data":{"directoryRoot":"https://example.com/locations"}}',
        }
      );
      replies = [
        completed(draft),
        completed({
          edits: [
            {
              kind: "prop",
              key: "footer-nav",
              path: ["layout", "gridTemplateColumns"],
              valueJson: JSON.stringify("repeat(2, minmax(0, 1fr))"),
            },
            {
              kind: "prop",
              key: "breadcrumbs",
              path: ["data", "directoryRoot"],
              valueJson: JSON.stringify({ defaultValue: "All Locations" }),
            },
          ],
        }),
      ];
      await run("repair-navigation");
      const report = await readFile(logPath("repair-navigation"), "utf8");
      assert.match(
        report,
        /primary FooterLinksSlot grids needs bounded columns/
      );
      assert.match(
        report,
        /directoryRoot is the displayed root breadcrumb label/
      );
      assert.match(
        report,
        /stage.completed.*"stage":"Static validation after repair"/
      );
    }
  );

  await t.test("reports the node and theme errors in one repair", async () => {
    const invalid = structuredClone(validDraft);
    invalid.nodes[1].propsJson =
      '{"responsive":{"mobile":{"typography":{"fontSize":false,"fontWeight":"700"}}}}';
    invalid.themeOverrides = [
      ...invalid.themeOverrides,
      { key: "pageContentMaxWidth", value: "800px" },
      { key: "navigationLinkFontFamily", value: "Fictional Test Family" },
    ];
    invalid.nodes[1].parentKey = "missing";
    // Keep both siblings ahead of their parent to exercise key-based resolution.
    invalid.nodes = [
      invalid.nodes[1],
      invalid.nodes[2],
      invalid.nodes[0],
      invalid.nodes[3],
      {
        key: "orders",
        type: "Disclosure",
        parentKey: "box",
        slot: "content",
        propsJson: '{"summary":{"text":"Order & Purchases"}}',
      },
    ];
    replies = [
      completed(invalid),
      completed({
        edits: [
          {
            kind: "prop",
            key: "heading",
            path: ["responsive", "mobile", "typography", "fontSize"],
            valueJson: null,
          },
          {
            kind: "placement",
            key: "heading",
            parentKey: "box",
            slot: "content",
          },
          {
            kind: "prop",
            key: "orders",
            path: ["summary"],
            valueJson: JSON.stringify({
              field: "",
              constantValueEnabled: true,
              constantValue: { defaultValue: "Order & Purchases" },
            }),
          },
          { kind: "theme", key: "pageContentMaxWidth", value: 800 },
          { kind: "theme", key: "navigationLinkFontFamily", value: null },
        ],
      }),
    ];
    const before = requests.length;
    await run("repaired");
    assert.equal(requests.length - before, 2);
    const repairRequest = requests.at(-1)!;
    assert.equal(repairRequest.text.format.name, "yext_layout_repair");
    const { issues } = JSON.parse(repairRequest.input[0].content.at(-1).text);
    assert(
      issues.some(
        (issue: RepairIssue) =>
          issue.kind === "prop" &&
          issue.key === "heading" &&
          issue.path.join(".") === "responsive.mobile.typography.fontSize" &&
          issue.message.includes("responsive.mobile.typography.fontSize")
      )
    );
    assert(
      issues.some(
        (issue: RepairIssue) =>
          issue.kind === "placement" && issue.key === "heading"
      )
    );
    const disclosure = issues.find(
      (issue: RepairIssue) => issue.kind === "prop" && issue.key === "orders"
    );
    assert.deepEqual(disclosure.path, ["summary"]);
    assert.equal(typeof disclosure.schemaIndex, "number");
    assert.equal(disclosure.example.constantValueEnabled, true);
    assert.deepEqual(
      issues
        .filter((issue: RepairIssue) => issue.kind === "theme")
        .map((issue: Extract<RepairIssue, { kind: "theme" }>) => issue.key),
      ["pageContentMaxWidth", "navigationLinkFontFamily"]
    );
    const artifact = JSON.parse(
      await readFile(join(directory, "repaired", "defaultLayout.json"), "utf8")
    );
    assert.deepEqual(
      artifact.content[0].props.content.map(
        ({ type }: { type: string }) => type
      ),
      ["Heading", "Paragraph", "Disclosure"]
    );
    assert.equal(
      artifact.content[0].props.content[2].props.summary.constantValue
        .defaultValue,
      "Order & Purchases"
    );
    assert.equal(
      artifact.content[0].props.surface.backgroundColor,
      "var(--ve-color-primary)"
    );
    assert.equal(artifact.content[1].type, "FAQSection");
    assert.equal(
      artifact.content[0].props.content[0].props.responsive.mobile.typography
        .fontWeight,
      "700"
    );
    const report = await readFile(logPath("repaired"), "utf8");
    assert.match(
      report,
      /stage.completed.*"stage":"Source capture","elapsedMs":\d+/
    );
    assert.match(
      report,
      /gateway.response.*"attempt":"generation".*"inputTokens":100.*"reasoningTokens":10/
    );
    assert.match(
      report,
      /gateway.response.*"attempt":"repair".*"totalTokens":140/
    );
    assert.match(
      report,
      /gateway.request.*"attempt":"generation".*"timeoutMs":720000/
    );
    assert.match(
      report,
      /gateway.request.*"attempt":"repair".*"timeoutMs":720000/
    );
    assert.match(report, /gateway.headers.*"requestId":"request-\d+"/);
    assert.match(report, /run.finished.*"outcome":"completed","elapsedMs":\d+/);
    assert(!report.includes("fixture-secret"));
    assert(!report.includes("data:image"));
    assert(!report.includes("propsJson"));
  });

  await t.test(
    "keeps a diagnostic log when the repair socket closes",
    async () => {
      const invalid = structuredClone(validDraft);
      invalid.nodes[1].parentKey = "missing";
      replies = [completed(invalid), disconnect];
      await assert.rejects(
        run("repair-disconnect"),
        /Model gateway repair: fetch failed \(UND_ERR_SOCKET\)/
      );
      const report = await readFile(logPath("repair-disconnect"), "utf8");
      assert.match(
        report,
        /stage.failed.*Node heading references unknown parent missing/
      );
      assert.match(
        report,
        /gateway.transport-error.*"attempt":"repair".*"code":"UND_ERR_SOCKET"/
      );
      const correlationId = requestHeaders.at(-1)!["correlation-id"];
      assert(report.includes(`"correlationId":"${correlationId}"`));
      assert.match(report, /run.finished.*"outcome":"failed"/);
      await assert.rejects(readdir(join(directory, "repair-disconnect")), {
        code: "ENOENT",
      });
    }
  );

  await t.test(
    "rejects an invalid theme after one repair and preserves the destination",
    async () => {
      const invalid = structuredClone(validDraft);
      invalid.themeOverrides = [{ key: "pageContentMaxWidth", value: "800px" }];
      replies = [
        completed(invalid),
        completed({
          edits: [
            { kind: "theme", key: "pageContentMaxWidth", value: "800px" },
          ],
        }),
        completed(validDraft),
      ];
      const before = requests.length;
      await assert.rejects(
        run("invalid-theme"),
        /Static validation after repair: Invalid value for theme field pageContentMaxWidth/
      );
      assert.equal(requests.length - before, 2);
      await assert.rejects(readdir(join(directory, "invalid-theme")), {
        code: "ENOENT",
      });
    }
  );

  await t.test(
    "rejects an entity binding that does not match the supplied schema",
    async () => {
      const schema = join(directory, "entity-schema.json");
      await writeFile(schema, '{"fields":{"name":"type.hours"}}');
      replies = [
        completed(validDraft),
        completed({
          edits: [
            {
              kind: "prop",
              key: "heading",
              path: ["data", "text"],
              valueJson: JSON.stringify(
                JSON.parse(validDraft.nodes[1].propsJson).data.text
              ),
            },
          ],
        }),
      ];
      await assert.rejects(
        run("invalid-binding", "/coffee", ["--entity-schema", schema]),
        /cannot bind name \(type.hours\)/
      );
      await assert.rejects(readdir(join(directory, "invalid-binding")), {
        code: "ENOENT",
      });
    }
  );

  await t.test(
    "repairs a parent cycle without changing other nodes",
    async () => {
      const invalid = structuredClone(validDraft);
      invalid.nodes[0].parentKey = "inner";
      invalid.nodes[0].slot = "content";
      invalid.nodes.push({
        key: "inner",
        type: "Box",
        parentKey: "box",
        slot: "content",
        propsJson: "{}",
      });
      replies = [
        completed(invalid),
        completed({
          edits: [
            { kind: "placement", key: "box", parentKey: null, slot: null },
          ],
        }),
      ];
      const target = await run("cycle");
      const artifact = JSON.parse(
        await readFile(join(target!, "defaultLayout.json"), "utf8")
      );
      assert.deepEqual(
        artifact.content[0].props.content.map(
          ({ type }: { type: string }) => type
        ),
        ["Heading", "Paragraph", "Box"]
      );
    }
  );

  await t.test(
    "repairs ambiguous parents and normalizes blank keys",
    async () => {
      const invalid = structuredClone(validDraft);
      invalid.nodes[2].parentKey = " ";
      invalid.nodes.push(
        { ...invalid.nodes[0], propsJson: '{"as":"aside"}' },
        { ...invalid.nodes[0], key: " ", propsJson: '{"as":"article"}' }
      );
      replies = [
        completed(invalid),
        completed({
          edits: [
            {
              kind: "placement",
              key: "heading",
              parentKey: "repair-node-2",
              slot: "content",
            },
          ],
        }),
      ];
      const before = requests.length;
      const target = await run("ambiguous-parent");
      assert(target);
      assert.equal(requests.length - before, 2);
      const { draft, issues } = JSON.parse(
        requests.at(-1)!.input[0].content.at(-1).text
      );
      assert.equal(
        new Set(draft.nodes.map(({ key }: { key: string }) => key)).size,
        6
      );
      assert.deepEqual(issues, [
        {
          kind: "placement",
          key: "heading",
          component: "Heading",
          message:
            'Node heading references ambiguous parent "box". Select the intended parent key.',
          expected: ["repair-node-1", "repair-node-2"],
        },
      ]);
      const { content } = JSON.parse(
        await readFile(join(target, "defaultLayout.json"), "utf8")
      );
      assert.deepEqual(content[0].props.content, []);
      assert.equal(content[2].props.content[0].type, "Heading");
      assert.equal(content[3].props.content[0].type, "Paragraph");
    }
  );

  await t.test("rejects repair edits to unrelated fields", () => {
    assert.throws(
      () =>
        applyRepair(
          validDraft,
          {
            edits: [
              { kind: "prop", key: "box", path: ["surface"], valueJson: null },
            ],
          },
          [
            {
              kind: "prop",
              key: "box",
              component: "Box",
              path: ["surface", "backgroundColor"],
              message: "Invalid color",
            },
          ]
        ),
      /outside the reported issues/
    );
  });

  await t.test("stops at missing guide or incomplete response", async () => {
    const before = requests.length;
    await assert.rejects(
      run("missing", "/missing-guide"),
      /Brand extraction: Designlang did not produce/
    );
    assert.equal(requests.length, before);
    replies = [
      {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      },
    ];
    await assert.rejects(
      run("incomplete"),
      /Response incomplete: max_output_tokens/
    );
    assert.equal(requests.length - before, 1);
    assert.match(
      await readFile(logPath("incomplete"), "utf8"),
      /gateway.response.*"incompleteReason":"max_output_tokens","tokenUsageReported":"no"/
    );
    for (const name of ["missing", "incomplete"]) {
      await assert.rejects(readdir(join(directory, name)), { code: "ENOENT" });
    }
  });
});
