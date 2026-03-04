"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { CopyButton } from "@/components/chat/copy-button";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

interface MessageMarkdownProps {
  content: string;
  className?: string;
}

export function MessageMarkdown({ content, className }: MessageMarkdownProps) {
  const components: Components = {
    // Headings
    h1: ({ children, ...props }) => (
      <h1
        className="text-2xl font-bold text-navy mt-6 mb-3 first:mt-0"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-xl font-bold text-navy mt-5 mb-2 first:mt-0"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-lg font-semibold text-navy mt-4 mb-2 first:mt-0"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4
        className="text-base font-semibold text-navy mt-3 mb-1 first:mt-0"
        {...props}
      >
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5
        className="text-sm font-semibold text-navy mt-3 mb-1 first:mt-0"
        {...props}
      >
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6
        className="text-sm font-medium text-navy mt-2 mb-1 first:mt-0"
        {...props}
      >
        {children}
      </h6>
    ),

    // Paragraphs
    p: ({ children, ...props }) => (
      <p className="leading-7 mb-3 last:mb-0" {...props}>
        {children}
      </p>
    ),

    // Links
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-saffron-600 hover:text-saffron-700 underline underline-offset-2 transition-colors font-medium"
        {...props}
      >
        {children}
      </a>
    ),

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-outside ml-6 mb-3 space-y-1.5" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="list-decimal list-outside ml-6 mb-3 space-y-1.5"
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-7 marker:text-saffron-500" {...props}>
        {children}
      </li>
    ),

    // Blockquote
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-saffron pl-4 italic text-muted-foreground my-4"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Code blocks
    pre: ({ children, ...props }) => {
      // Extract the language from the child code element's className
      const codeChild = children as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;
      const codeClassName = codeChild?.props?.className || "";
      const languageMatch = codeClassName.match(/language-(\w+)/);
      const language = languageMatch ? languageMatch[1] : "";
      const codeText =
        typeof codeChild?.props?.children === "string"
          ? codeChild.props.children
          : "";

      return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-border">
          {/* Language label and copy button */}
          <div className="flex items-center justify-between bg-muted/80 px-4 py-2 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wider">
              {language || "code"}
            </span>
            {codeText && <CopyButton text={codeText} />}
          </div>
          <pre
            className="overflow-x-auto bg-[#FAFAF9] p-4 text-sm leading-relaxed"
            {...props}
          >
            {children}
          </pre>
        </div>
      );
    },

    code: ({ className, children, ...props }) => {
      const isInline = !className;

      if (isInline) {
        return (
          <code
            className="bg-saffron-50 text-saffron-700 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <code className={cn("font-mono text-sm", className)} {...props}>
          {children}
        </code>
      );
    },

    // Tables
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/60" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="divide-y divide-border" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="even:bg-muted/30 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-4 py-2.5 text-left text-xs font-semibold text-navy uppercase tracking-wider"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2.5 text-sm" {...props}>
        {children}
      </td>
    ),

    // Horizontal Rule
    hr: ({ ...props }) => (
      <hr className="my-6 border-t border-border" {...props} />
    ),

    // Strong and emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Images
    img: ({ src, alt, ...props }) => (
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full h-auto rounded-xl my-4 border border-border"
        loading="lazy"
        {...props}
      />
    ),
  };

  return (
    <div className={cn("prose-india max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
