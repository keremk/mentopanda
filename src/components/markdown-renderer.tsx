"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

type Props = {
  content: string;
  className?: string;
};

// This is a workaround to fix the issue with whitespace in markdown
// The error: isSpace is not defined
// There is a related discussion here: https://github.com/ueberdosis/tiptap/issues/873

export function isSpace(code: number) {
  switch (code) {
    case 0x09: // \t
    case 0x20: //
      return true;
  }
  return false;
}

if (typeof window !== "undefined") {
  (window as any).isSpace = isSpace;
}

export function MarkdownRenderer({ content, className = "" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4 mb-4",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-4 mb-4",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "ml-2 mb-1",
        },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: false,
        breaks: true,
      }),
    ],
    content,
    editable: false,
  });

  // editor?.commands.setContent(content, false, {
  //   preserveWhitespace: "full",
  // });

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <EditorContent
        editor={editor}
        className="[&_.tiptap_h1]:text-3xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-4 
                   [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-3
                   [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:mb-2
                   [&_.tiptap_h4]:text-lg [&_.tiptap_h4]:font-bold [&_.tiptap_h4]:mb-2
                   [&_.tiptap_p]:mb-4
                   [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                   [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                   [&_li]:ml-2 [&_li]:mb-1"
      />
    </div>
  );
}
