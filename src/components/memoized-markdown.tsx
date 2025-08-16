import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { type Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-3xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="leading-7 not-first:mt-6">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
      {children}
    </code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-brand hover:text-brand-hover underline hover:no-underline transition-colors"
    >
      {children}
    </a>
  ),
};

// Helper to generate stable keys for blocks
function generateStableKey(content: string, index: number): string {
  // Use the first 32 chars of content as part of the key
  const contentHash = content.slice(0, 32).replace(/\s+/g, "-");
  return `block-${index}-${contentHash}`;
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlockWithCustomComponents = memo(
  function MemoizedMarkdownBlockWithCustomComponents({
    content,
    customComponents,
  }: {
    content: string;
    customComponents?: Components;
  }) {
    const components = customComponents
      ? { ...markdownComponents, ...customComponents }
      : markdownComponents;

    return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
  }
);

export const MemoizedMarkdown = memo(function MemoizedMarkdown({
  content,
  customComponents,
}: {
  content: string;
  customComponents?: Components;
}) {
  // Only parse new content after it's been stable for 100ms
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlockWithCustomComponents
          content={block}
          customComponents={customComponents}
          key={generateStableKey(block, index)}
        />
      ))}
    </div>
  );
});
