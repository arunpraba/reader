import type { CSSProperties } from "react";
import { useMemo } from "react";
import { readableText } from "@/lib/readable-text";
import { tableOfContents } from "@/lib/table-of-contents";
import { MarkdownDocument } from "../markdown-document";

export function ReaderPaper({
  editing,
  content,
  highlightColors,
  fontSize,
  lineHeight,
  letterSpacing,
  guidedFocus,
  guidedFocusOpacity,
  virtualize = false,
  onContentChange,
  onStartAt,
}: {
  editing: boolean;
  content: string;
  highlightColors: {
    word: string;
    sentence: string;
    paragraph: string;
  };
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  guidedFocus: boolean;
  guidedFocusOpacity: number;
  /** Skip offscreen block layout when the doc is very large. */
  virtualize?: boolean;
  onContentChange: (content: string) => void;
  onStartAt: (blockIndex: number, wordOrdinal: number) => void;
}) {
  const toc = useMemo(
    () => (editing ? [] : tableOfContents(content)),
    [content, editing],
  );
  return (
    <article
      className="reader-paper"
      style={
        {
          "--highlight-word": highlightColors.word,
          "--highlight-word-text": readableText(highlightColors.word),
          "--highlight-sentence": highlightColors.sentence,
          "--highlight-sentence-text": readableText(highlightColors.sentence),
          "--highlight-paragraph": highlightColors.paragraph,
          "--highlight-paragraph-text": readableText(highlightColors.paragraph),
          "--reader-font-size": `${fontSize}rem`,
          "--reader-line-height": String(lineHeight),
          "--reader-letter-spacing": `${letterSpacing}em`,
          "--reader-guided-rest-opacity": String(guidedFocusOpacity),
        } as CSSProperties
      }
    >
      {editing ? (
        <textarea
          className="notion-editor"
          style={{
            fontSize: `${fontSize}rem`,
            lineHeight: lineHeight,
            letterSpacing: `${letterSpacing}em`,
          }}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          aria-label="Markdown page editor"
          spellCheck
        />
      ) : (
        <>
          {toc.length > 1 ? (
            <nav className="reader-toc" aria-label="Contents">
              <h2>Contents</h2>
              <ol>
                {toc.map((item) => (
                  <li
                    key={item.id}
                    style={{ paddingLeft: (item.depth - 1) * 12 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <MarkdownDocument
            content={content}
            headingIds={toc.map((item) => item.id)}
            guidedFocus={guidedFocus}
            virtualize={virtualize}
            onStartAt={onStartAt}
          />
        </>
      )}
    </article>
  );
}
