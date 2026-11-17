// Paste into the browser console on a rendered local editor or preview page.
(async () => {
  const frame = document.querySelector("iframe#preview-frame");
  const source = frame ? frame.contentDocument : document;
  if (!source?.body || !source.body.textContent.trim()) {
    throw new Error("Wait for the preview to render before exporting.");
  }

  const root = source.documentElement.cloneNode(true);
  const head = root.querySelector("head");
  const body = root.querySelector("body");
  const assets = new Map();
  const missing = new Set();
  const embed = (url, base = source.baseURI) => {
    const absolute = new URL(url, base).href;
    if (/^(data:|#)/.test(url)) return Promise.resolve(url);
    if (!assets.has(absolute)) {
      assets.set(
        absolute,
        fetch(absolute, { signal: AbortSignal.timeout(8000) })
          .then((response) => {
            if (!response.ok) throw new Error(String(response.status));
            return response.blob();
          })
          .then(
            (blob) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              })
          )
          .catch(() => {
            missing.add(absolute);
            return absolute;
          })
      );
    }
    return assets.get(absolute);
  };
  const embedCss = async (css, base) => {
    const matches = [...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)];
    const replacements = await Promise.all(
      matches.map(async (match) => [match[0], await embed(match[2], base)])
    );
    for (const [original, url] of replacements) {
      css = css.replaceAll(original, `url("${url}")`);
    }
    return css;
  };

  // Preserve CSS injected by Vite, CSSOM rules, and constructed stylesheets.
  const styles = await Promise.all(
    [...source.styleSheets, ...source.adoptedStyleSheets].map(async (sheet) => {
      let css;
      try {
        css = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
      } catch {
        if (!sheet.href) return "";
        try {
          const response = await fetch(sheet.href, {
            signal: AbortSignal.timeout(8000),
          });
          if (!response.ok) throw new Error(String(response.status));
          css = await response.text();
        } catch {
          missing.add(sheet.href);
          return `@import url(${JSON.stringify(sheet.href)});`;
        }
      }
      return embedCss(css, sheet.href || source.baseURI);
    })
  );
  root
    .querySelectorAll("script, style, link, base")
    .forEach((el) => el.remove());
  const style = source.createElement("style");
  style.textContent = styles.join("\n");
  head.append(style);

  // Freeze loaded images, including the browser's selected responsive image.
  const originalImages = [...source.images];
  await Promise.all(
    [...root.querySelectorAll("img")].map(async (image, index) => {
      const original = originalImages[index];
      image.src = await embed(original.currentSrc || original.src);
      image.removeAttribute("srcset");
      image.removeAttribute("sizes");
      image.loading = "eager";
    })
  );
  root.querySelectorAll("picture source").forEach((el) => el.remove());
  await Promise.all(
    [...root.querySelectorAll("[style]")].map(async (el) => {
      el.setAttribute(
        "style",
        await embedCss(el.getAttribute("style"), source.baseURI)
      );
    })
  );
  for (const el of root.querySelectorAll("[href]")) {
    const href = el.getAttribute("href");
    if (href && !href.startsWith("#"))
      el.setAttribute("href", new URL(href, source.baseURI).href);
  }
  root
    .querySelectorAll("[data-puck-overlay-portal]")
    .forEach((el) => el.remove());
  root.querySelectorAll("*").forEach((el) => {
    for (const attribute of [...el.attributes]) {
      if (/^on/i.test(attribute.name)) el.removeAttribute(attribute.name);
    }
  });
  body.style.margin = "0";

  const blob = new Blob(["<!doctype html>\n", root.outerHTML], {
    type: "text/html;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local-preview.html";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  if (missing.size) {
    console.warn("Exported. These assets still need a network connection:", [
      ...missing,
    ]);
  } else {
    console.log(
      "Exported local-preview.html. JavaScript interactions are not included."
    );
  }
})();
