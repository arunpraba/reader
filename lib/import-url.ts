export class ImportUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportUrlError";
  }
}

export function isImportUrl(text: string) {
  try {
    const url = new URL(text.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveImportUrl(input: string) {
  const url = new URL(input.trim());

  const githubBlob = url.hostname.replace(/^www\./, "") === "github.com";
  if (githubBlob) {
    const match = url.pathname.match(
      /^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
    );
    if (match)
      return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`;
  }

  const gist = url.hostname.replace(/^www\./, "") === "gist.github.com";
  if (gist) {
    const match = url.pathname.match(/^\/([^/]+)\/([a-f0-9]+)(?:\/(.+))?$/i);
    if (match) {
      const file = match[3] ? `/raw/${match[3]}` : "";
      return `https://gist.githubusercontent.com/${match[1]}/${match[2]}${file}`;
    }
  }

  return url.toString();
}

function titleFromPath(url: string) {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const last = path.split("/").filter(Boolean).at(-1) ?? "Imported page";
    return last
      .replace(/\.(md|markdown|txt|html?)$/i, "")
      .replace(/[-_]+/g, " ");
  } catch {
    return "Imported page";
  }
}

function titleFromMarkdown(content: string, fallback: string) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function extractFromHtml(html: string, url: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, style, nav, footer, aside, noscript, iframe")
    .forEach((node) => node.remove());
  const fallback = titleFromPath(url);
  const title =
    doc
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    fallback;
  const root =
    doc.querySelector("article") ||
    doc.querySelector('[role="main"]') ||
    doc.querySelector("main") ||
    doc.body;
  const paragraphs = (root?.textContent ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!paragraphs.length)
    throw new ImportUrlError("No readable content found at this link");
  const body = paragraphs.join("\n\n");
  const content = body.startsWith("# ") ? body : `# ${title}\n\n${body}`;
  return { title: titleFromMarkdown(content, title), content };
}

async function fetchUrl(url: string) {
  try {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok)
      throw new ImportUrlError(
        `Could not fetch link (HTTP ${response.status})`,
      );
    return response;
  } catch (error) {
    if (error instanceof ImportUrlError) throw error;
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxy, { credentials: "omit" });
    if (!response.ok) throw new ImportUrlError("Could not fetch this link");
    return response;
  }
}

export async function fetchImportFromUrl(input: string) {
  const trimmed = input.trim();
  if (!isImportUrl(trimmed))
    throw new ImportUrlError("Paste a valid http or https link");

  const resolved = resolveImportUrl(trimmed);
  const response = await fetchUrl(resolved);
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text.trim()) throw new ImportUrlError("Link returned empty content");

  if (contentType.includes("html") || /^\s*</.test(text))
    return extractFromHtml(text, resolved);

  const fallback = titleFromPath(resolved);
  return {
    title: titleFromMarkdown(text, fallback),
    content: text,
  };
}
