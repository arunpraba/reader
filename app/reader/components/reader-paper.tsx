import type { CSSProperties } from "react";
import { readableText } from "../../../lib/readable-text";
import { MarkdownDocument } from "../markdown-document";

export function ReaderPaper({
  editing,
  content,
  highlightColors,
  fontSize,
  lineHeight,
  letterSpacing,
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
  onContentChange: (content: string) => void;
  onStartAt: (blockIndex: number, wordOrdinal: number) => void;
}) {
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
        <MarkdownDocument content={content} onStartAt={onStartAt} />
      )}
    </article>
  );
}
