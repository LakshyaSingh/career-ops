"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Apple-style markdown renderer. Styling lives in globals.css under
 * `.prose-apple` so we can iterate on type without touching component code.
 *
 * GFM gives us tables, strikethrough, and task lists — career-ops reports use
 * tables for compensation research and tracker rows.
 */
export function MarkdownView({ source }: { source: string }) {
  return (
    <article className="prose-apple">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
