"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

type Props = {
  assessment: string;
  transcript?: string | null;
  score?: number | null;
};

export function AssessmentContent({ assessment, transcript }: Props) {
  const [isOpen, setIsOpen] = useState(false);

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
    content: assessment,
    editable: false,
  });

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Conversation Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
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

          {transcript && (
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="w-full"
            >
              <div className="flex items-center justify-between py-2">
                <h3 className="text-lg font-semibold">
                  Conversation Transcript
                </h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle transcript</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <Card className="p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {transcript}
                  </pre>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
