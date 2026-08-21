type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  value?: string;
  children?: HastNode[];
};

function hastText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

export function rehypeReadingBlocks() {
  return (tree: { children?: HastNode[] }) => {
    let index = 0;
    for (const child of tree.children ?? []) {
      if (child.type !== "element" || child.tagName === "hr") continue;
      const text = hastText(child).replace(/\s+/g, " ").trim();
      if (!text) continue;
      child.properties ??= {};
      child.properties["data-read-block"] = index++;
    }
  };
}
