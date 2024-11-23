"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

type Props = {
  content: string;
  onChange: (markdown: string) => void;
  className?: string;
};

export function MarkdownEditor({ content, onChange, className = "" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-4 mb-4',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal ml-4 mb-4',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'ml-2 mb-1',
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
    autofocus: 'end',
  });

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
      />
    </div>
  );
} 