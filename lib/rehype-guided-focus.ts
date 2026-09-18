import {
  segmentGuidedFocusText,
  splitGuidedFocusWord,
} from "./guided-focus";

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  value?: string;
  children?: HastNode[];
};

const SKIP_TAGS = new Set([
  "code",
  "pre",
  "kbd",
  "samp",
  "svg",
  "script",
  "style",
  "math",
  "annotation",
  "annotation-xml",
]);

function classNameOf(node: HastNode): string {
  const raw = node.properties?.className;
  if (Array.isArray(raw)) return raw.map(String).join(" ");
  if (typeof raw === "string") return raw;
  return "";
}

function shouldSkipElement(node: HastNode): boolean {
  if (node.type !== "element") return false;
  if (SKIP_TAGS.has(node.tagName ?? "")) return true;
  const classes = classNameOf(node);
  return classes.includes("katex") || classes.includes("math");
}

function span(className: string, value: string): HastNode {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [className] },
    children: [{ type: "text", value }],
  };
}

function guidedWord(parts: {
  prefix: string;
  middle: string;
  end: string;
}): HastNode {
  return {
    type: "element",
    tagName: "span",
    properties: { className: ["guided-word"] },
    children: [
      span("guided-fix", parts.prefix),
      span("guided-rest", parts.middle),
      span("guided-end", parts.end),
    ],
  };
}

function transformTextValue(value: string): HastNode[] | null {
  const segments = segmentGuidedFocusText(value);
  const children: HastNode[] = [];
  let changed = false;

  for (const part of segments) {
    if (!part.isWord) {
      children.push({ type: "text", value: part.text });
      continue;
    }
    const split = splitGuidedFocusWord(part.text);
    if (!split) {
      children.push({ type: "text", value: part.text });
      continue;
    }
    changed = true;
    children.push(guidedWord(split));
  }

  return changed ? children : null;
}

function walk(node: HastNode) {
  if (node.type === "element" && shouldSkipElement(node)) return;

  const children = node.children;
  if (!children?.length) return;

  const next: HastNode[] = [];
  let changed = false;

  for (const child of children) {
    if (child.type === "text" && typeof child.value === "string") {
      const replacement = transformTextValue(child.value);
      if (replacement) {
        next.push(...replacement);
        changed = true;
        continue;
      }
    }
    walk(child);
    next.push(child);
  }

  if (changed) node.children = next;
}

export function rehypeGuidedFocus() {
  return (tree: HastNode) => {
    walk(tree);
  };
}
