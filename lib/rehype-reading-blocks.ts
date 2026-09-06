type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  value?: string;
  children?: HastNode[];
};

/** Elements skipped so DOM block indices stay aligned with TTS (lib/reader.ts). */
const SKIP_TAGS = new Set(["hr", "pre", "img", "svg", "script", "style"]);

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (node.type === "element" && SKIP_TAGS.has(node.tagName ?? "")) return "";
  return (node.children ?? []).map(hastText).join("");
}

export function rehypeReadingBlocks() {
  return (tree: { children?: HastNode[] }) => {
    let index = 0;
    for (const child of tree.children ?? []) {
      if (child.type !== "element") continue;
      if (SKIP_TAGS.has(child.tagName ?? "")) continue;
      const text = hastText(child).replace(/\s+/g, " ").trim();
      if (!text) continue;
      child.properties ??= {};
      child.properties["data-read-block"] = index++;
    }
  };
}
