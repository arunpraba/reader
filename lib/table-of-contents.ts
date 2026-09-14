import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkToc from "remark-toc";
import { unified } from "unified";

export type TocItem = {
  depth: number;
  id: string;
  text: string;
};

const MARKER = "margin-contents";

type MdastNode = {
  type?: string;
  url?: string;
  depth?: number;
  children?: MdastNode[];
};

function findLink(node: MdastNode): MdastNode | undefined {
  if (node.type === "link" && node.url?.startsWith("#")) return node;
  for (const child of node.children ?? []) {
    const link = findLink(child);
    if (link) return link;
  }
  return undefined;
}

function collect(list: MdastNode, depth: number, items: TocItem[]) {
  for (const item of list.children ?? []) {
    const link = findLink(item);
    if (link?.url) {
      items.push({
        depth,
        id: decodeURIComponent(link.url.slice(1)),
        text: toString(link),
      });
    }
    for (const child of item.children ?? []) {
      if (child.type === "list") collect(child, depth + 1, items);
    }
  }
}

/** Build a contents list with remark-toc. The page text itself is unchanged. */
export function tableOfContents(markdown: string): TocItem[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(`###### ${MARKER}\n\n${markdown}`);
  unified()
    .use(remarkToc, { heading: `^${MARKER}$`, maxDepth: 6 })
    .runSync(tree);

  const items: TocItem[] = [];
  const root = tree as MdastNode;
  const markerIndex = (root.children ?? []).findIndex(
    (node) => node.type === "heading" && toString(node) === MARKER,
  );
  const list = root.children?.[markerIndex + 1];
  if (list?.type === "list") collect(list, 1, items);
  return items;
}

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/** Assign the same ids remark-toc generated, in document order. */
function assignHeadingIds(
  node: HastNode,
  ids: string[],
  index: { value: number },
) {
  if (
    node.type === "element" &&
    node.tagName &&
    /^h[1-6]$/.test(node.tagName)
  ) {
    const id = ids[index.value++];
    if (id) node.properties = { ...node.properties, id };
  }
  for (const child of node.children ?? []) assignHeadingIds(child, ids, index);
}

export function rehypeHeadingIds(ids: string[]) {
  return (tree: HastNode) => {
    assignHeadingIds(tree, ids, { value: 0 });
  };
}
