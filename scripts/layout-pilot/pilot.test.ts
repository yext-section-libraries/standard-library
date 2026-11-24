import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runPilot } from "./cli.ts";
import type { Draft } from "./gateway.ts";

const validDraft: Draft = {
  displayName: "Fixture Coffee",
  nodes: [
    {
      type: "Box",
      parentIndex: null,
      slot: null,
      propsJson: JSON.stringify({
        as: "section",
        surface: { backgroundColor: "rgb(18, 52, 86)", borderColor: "#abc" },
        states: { hover: { surface: { backgroundColor: "#123456" } } },
      }),
    },
    {
      type: "Heading",
      parentIndex: 0,
      slot: "content",
      propsJson: JSON.stringify({
        as: "h1",
        typographyRole: "headline",
        data: { text: { field: "name", constantValueEnabled: false } },
      }),
    },
    {
      type: "Paragraph",
      parentIndex: 0,
      slot: "content",
      propsJson:
        '{"data":{"text":{"field":"address.city","constantValueEnabled":false}}}',
    },
    { type: "FAQSection", parentIndex: null, slot: null, propsJson: "{}" },
  ],
  themeOverrides: [
    { key: "colorPrimary", value: "#123456" },
    { key: "linkFontFamily", value: "Lato, sans-serif" },
  ],
  omissions: ["Store number"],
  themeSubstitutions: ["Used a fallback font"],
};

const completed = (draft: Draft) => ({
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
    response.writeHead(200, { "Content-Type": "text/html" });
    const loaded = `<section><h1>Fixture Coffee</h1><p>Open daily. <a href="/details">Details</a></p><p class="mobile">Mobile only</p>${"<p>More copy</p>".repeat(360)}</section>`;
    const footer = `<footer><nav aria-label="Company"><h2>Company</h2><ul><li><a href="/jobs">Careers</a></li></ul></nav>
      <details><summary>Policies</summary><a href="/privacy">Privacy</a></details>
      <a href="/social" aria-label="Follow us"></a><p>All rights reserved.</p></footer>`;
    const main =
      request.url === "/loading"
        ? `<p role="status">Loading…</p><script>
          setTimeout(() => {
            document.querySelector("main").innerHTML = ${JSON.stringify(loaded + '<div id="footer-sentinel" style="height:1px"></div>')};
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
    response.end(`<!doctype html><html><head><title>Fixture Coffee</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body {background: white} .mobile {display:none}
        header a {font: 700 22px Arial} main a {font: 400 14px Georgia}
        @media(max-width:600px) { .mobile {display:block} header a {font-size:17px} }</style></head>
      <body><header><a href="/menu">Menu</a></header><main>${main}</main></body></html>`);
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
      assert.equal(images.length, 4);
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

  await t.test("reports the node and theme errors in one repair", async () => {
    const invalid = structuredClone(validDraft);
    invalid.nodes[1].propsJson =
      '{"responsive":{"mobile":{"typography":{"fontSize":false}}}}';
    invalid.themeOverrides = [
      { key: "pageContentMaxWidth", value: "800px" },
      { key: "navigationLinkFontFamily", value: "Fictional Test Family" },
    ];
    replies = [completed(invalid), completed(validDraft)];
    const before = requests.length;
    await run("repaired");
    assert.equal(requests.length - before, 2);
    const repair = requests.at(-1)!.input[0].content.at(-1).text;
    assert.match(repair, /responsive\.mobile\.typography\.fontSize/);
    assert.match(repair, /Invalid value for theme field pageContentMaxWidth/);
    assert.match(
      repair,
      /Invalid value for theme field navigationLinkFontFamily/
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
      invalid.nodes[1].parentIndex = 2;
      replies = [completed(invalid), disconnect];
      await assert.rejects(
        run("repair-disconnect"),
        /Model gateway repair: fetch failed \(UND_ERR_SOCKET\)/
      );
      const report = await readFile(logPath("repair-disconnect"), "utf8");
      assert.match(
        report,
        /stage.failed.*Node 1 must reference an earlier parent index/
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
      replies = [completed(invalid), completed(invalid), completed(validDraft)];
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
      replies = [completed(validDraft), completed(validDraft)];
      await assert.rejects(
        run("invalid-binding", "/coffee", ["--entity-schema", schema]),
        /cannot bind name \(type.hours\)/
      );
      await assert.rejects(readdir(join(directory, "invalid-binding")), {
        code: "ENOENT",
      });
    }
  );

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
