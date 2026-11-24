import { randomUUID } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import {
  lstat,
  mkdir,
  mkdtemp,
  rename,
  rm,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";
import { capturePage, extractGuide } from "./capture.ts";
import { openRunLog, type Diagnostic } from "./diagnostics.ts";
import { defaultModel, gatewayUrl, requestDraft } from "./gateway.ts";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const { get: registrableDomain } = createRequire(import.meta.url)("psl") as {
  get(hostname: string): string | null;
};
const usage = `Usage: npm run layouts:pilot -- <url> [--brand <slug>] [--entity-schema <file>] [--out <directory>] [--log-file <path>]

Entity schema format: {"fields":{"name":"type.string","address":"type.address"}}
Model override: LAYOUT_PILOT_MODEL. Optional gateway bearer key: LAYOUT_PILOT_API_KEY.
Gateway business override: LAYOUT_PILOT_BUSINESS_ID.
An explicit output path must name a new directory.
Each run logs to a new .log.txt file in the OS temp directory by default.
Choose a new --log-file path outside the output directory to keep the log elsewhere.
Use installed Google Chrome, or install browsers with npx playwright install chromium
and npx --yes designlang@13.4.1 install-browser.`;

function parseOptions(args: string[]) {
  return parseArgs({
    args,
    allowPositionals: true,
    options: {
      brand: { type: "string" },
      "entity-schema": { type: "string" },
      out: { type: "string" },
      "log-file": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
}

function parseSource(source: string, override?: string) {
  const url = new URL(source);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "Provide an HTTP(S) source URL without embedded credentials"
    );
  }
  // A fragment targets a viewport position, so capture the document from its beginning.
  url.hash = "";
  const brand = override ?? registrableDomain(url.hostname)?.split(".")[0];
  if (
    !brand ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(brand) ||
    brand.length > 80
  ) {
    throw new Error(
      "Use --brand with a lowercase, hyphenated slug of at most 80 characters"
    );
  }
  return { url, brand };
}

async function checkDestination(target: string) {
  try {
    await lstat(target);
    throw new Error(`Output directory already exists: ${target}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function writeArtifacts(target: string, files: Record<string, unknown>) {
  await mkdir(dirname(target), { recursive: true });
  const staging = await mkdtemp(join(dirname(target), ".layout-pilot-"));
  let reserved = false;
  try {
    for (const [name, value] of Object.entries(files)) {
      await writeFile(
        join(staging, name),
        JSON.stringify(value, null, 2) + "\n"
      );
    }
    await mkdir(target);
    reserved = true;
    await rename(staging, target);
    reserved = false;
  } finally {
    if (reserved) await rmdir(target);
    await rm(staging, { recursive: true, force: true });
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function runStage<T>(
  record: Diagnostic,
  name: string,
  work: () => T | Promise<T>,
  reportError = false
) {
  const start = performance.now();
  record("stage.started", { stage: name });
  try {
    const result = await work();
    record("stage.completed", {
      stage: name,
      elapsedMs: Math.round(performance.now() - start),
    });
    return result;
  } catch (error) {
    record("stage.failed", {
      stage: name,
      elapsedMs: Math.round(performance.now() - start),
      errorName: error instanceof Error ? error.name : undefined,
      code: (error as NodeJS.ErrnoException | undefined)?.code,
      detail: reportError ? message(error).slice(0, 4_000) : undefined,
    });
    throw new Error(`${name}: ${message(error)}`, { cause: error });
  }
}

export async function runPilot(
  args: string[],
  options: {
    endpoint?: string;
    model?: string;
    apiKey?: string;
    log?: (line: string) => void;
  } = {}
) {
  const log = options.log ?? console.log;
  const { values, positionals } = parseOptions(args);
  if (values.help) {
    log(usage);
    return;
  }
  if (positionals.length !== 1) throw new Error(usage);
  const { url, brand } = parseSource(positionals[0], values.brand);
  const runId = randomUUID();
  const target = resolve(
    values.out ?? join(tmpdir(), `layout-pilot-${brand}-${runId}`)
  );
  const logPath = resolve(
    values["log-file"] ??
      join(tmpdir(), `layout-pilot-${brand}-${runId}.log.txt`)
  );
  const fromTarget = relative(target, logPath);
  if (
    !fromTarget ||
    (!isAbsolute(fromTarget) && fromTarget.split(sep)[0] !== "..")
  ) {
    throw new Error("Choose a log file outside the artifact directory");
  }
  await mkdir(dirname(logPath), { recursive: true });
  const runLog = openRunLog(logPath);
  const record = runLog.record;
  const stage = <T>(
    name: string,
    work: () => T | Promise<T>,
    reportError = false
  ) => runStage(record, name, work, reportError);
  const start = performance.now();
  let scratch: string | undefined;
  let outcome = "failed";
  try {
    log(`Run log: ${logPath}`);
    record("run.started", {
      runId,
      brand,
      sourceHost: url.hostname,
      outputDirectory: target,
    });
    await stage("Output directory", () => checkDestination(target));
    const scratchPath = await stage("Scratch setup", () =>
      mkdtemp(join(tmpdir(), "layout-pilot-scratch-"))
    );
    scratch = scratchPath;
    const captures = await stage("Source capture", () => {
      log("Capturing the source page at desktop and mobile widths");
      return capturePage(url, scratchPath);
    });
    for (const { data, screenshot, footerScreenshot, elapsedMs } of captures) {
      record("capture.ready", {
        viewport: data.name,
        width: data.width,
        height: data.height,
        inventoryEntries: data.count,
        includedEntries: data.entries.length,
        screenshotBytes: screenshot.length,
        footerScreenshotBytes: footerScreenshot?.length,
        elapsedMs,
      });
    }
    log("Extracting the Designlang brand guide");
    const guide = await stage("Brand extraction", () =>
      extractGuide(url, brand, scratchPath)
    );
    // Vite loads the source registry's JSX, CSS imports, and section glob.
    const { contractModule, contracts } = await stage(
      "Layout contracts",
      async () => {
        const server = await createServer({
          configFile: false,
          appType: "custom",
          root: repository,
          cacheDir: join(scratchPath, "vite-cache"),
          optimizeDeps: { noDiscovery: true, include: [] },
          server: { middlewareMode: true, hmr: { server: createHttpServer() } },
          define: { __VISUAL_EDITOR_TEST__: "false" },
        });
        try {
          const contractModule = (await server.ssrLoadModule(
            "/scripts/layout-pilot/contracts.ts"
          )) as typeof import("./contracts.ts");
          return {
            contractModule,
            contracts: await contractModule.loadContracts(
              values["entity-schema"]
            ),
          };
        } finally {
          await server.close();
        }
      }
    );
    const evidence = {
      url: url.href,
      brand,
      captures,
      guide,
      contracts: contracts.prompt,
    };
    const gateway = {
      endpoint: options.endpoint ?? gatewayUrl,
      model: options.model ?? process.env.LAYOUT_PILOT_MODEL ?? defaultModel,
      apiKey: options.apiKey,
      businessId: process.env.LAYOUT_PILOT_BUSINESS_ID,
      diagnostic: record,
    };
    log(`Generating a layout with ${gateway.model} at high reasoning effort`);
    let draft = await stage("Model gateway", () =>
      requestDraft(evidence, gateway)
    );
    let candidate: ReturnType<typeof contractModule.materialize>;
    try {
      candidate = await stage(
        "Static validation",
        () => contractModule.materialize(draft, brand, contracts),
        true
      );
    } catch (error) {
      const failure = message(
        error instanceof Error ? (error.cause ?? error) : error
      );
      log(`Static validation failed: ${failure}. Requesting one repair.`);
      draft = await stage("Model gateway repair", () =>
        requestDraft(evidence, gateway, { draft, failure })
      );
      candidate = await stage(
        "Static validation after repair",
        () => contractModule.materialize(draft, brand, contracts),
        true
      );
    }
    await stage("Writing artifacts", () =>
      writeArtifacts(target, {
        "defaultLayout.json": candidate.layout,
        "metadata.json": candidate.metadata,
        [`${brand}-theme.json`]: candidate.theme,
      })
    );
    log(`Static validation passed. Wrote three JSON files to ${target}`);
    log(
      `Theme fields using registered defaults: ${candidate.defaultedThemeFields.length}`
    );
    for (const omission of draft.omissions) log(`Omitted: ${omission}`);
    for (const substitution of draft.themeSubstitutions)
      log(`Theme substitution: ${substitution}`);
    record("artifacts.ready", {
      fileCount: 3,
      defaultedThemeFields: candidate.defaultedThemeFields.length,
      paletteReplacements: candidate.paletteReplacements,
    });
    outcome = "completed";
    return target;
  } finally {
    const path = scratch;
    let cleanupCompleted = !path;
    try {
      if (path) {
        await stage("Scratch cleanup", () =>
          rm(path, { recursive: true, force: true })
        );
        cleanupCompleted = true;
      }
    } finally {
      try {
        record("run.finished", {
          outcome: cleanupCompleted ? outcome : "failed",
          elapsedMs: Math.round(performance.now() - start),
        });
      } finally {
        runLog.close();
      }
    }
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runPilot(process.argv.slice(2), {
    apiKey: process.env.LAYOUT_PILOT_API_KEY,
  }).catch((error) => {
    console.error(message(error));
    process.exitCode = 1;
  });
}
