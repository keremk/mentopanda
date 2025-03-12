"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";
import { useEffect } from "react";

// Custom extension for font size - simplified
const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

type Props = {
  content: string;
  onChange: (markdown: string) => void;
  className?: string;
  fontFamily?: string;
  fontSize?: string;
};

export function MarkdownEditor({
  content,
  onChange,
  className = "",
  fontFamily = "Inter, sans-serif",
  fontSize = "1rem",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      TextStyle,
      FontFamily,
      FontSize,
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
    editable: true,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    autofocus: false, // Changed from 'end' to false to prevent focus issues
  });

  // Apply font styling via useEffect to prevent render loops
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      // Apply font family
      if (fontFamily) {
        editor.commands.setFontFamily(fontFamily);
      }

      // Apply font size
      if (fontSize) {
        editor.chain().setMark("textStyle", { fontSize }).run();
      }
    }
  }, [editor, fontFamily, fontSize]);

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <EditorContent
        editor={editor}
        className="min-h-[200px] p-4
                   [&_.tiptap]:outline-none [&_.tiptap]:border-none
                   [&_.tiptap_h1]:text-3xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-4 
                   [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-3
                   [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-bold [&_.tiptap_h3]:mb-2
                   [&_.tiptap_h4]:text-lg [&_.tiptap_h4]:font-bold [&_.tiptap_h4]:mb-2
                   [&_.tiptap_p]:mb-4
                   [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                   [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                   [&_li]:ml-2 [&_li]:mb-1"
        style={{
          fontFamily,
          fontSize,
        }}
      />
    </div>
  );
}
