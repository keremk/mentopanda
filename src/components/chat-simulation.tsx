'use client'

import { Button } from "@/components/ui/button"
import { MessageSquare, PhoneOff } from 'lucide-react'

type ChatSimulationProps = {
  onEndConversation: () => void;
  prompt: string;
}

export function ChatSimulationComponent({ onEndConversation, prompt }: ChatSimulationProps) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Chat Conversation</h3>
      <div className="bg-muted p-4 rounded-md min-h-[200px] flex items-center justify-center">
        <MessageSquare className="w-12 h-12 text-primary" />
      </div>
      <Button onClick={onEndConversation} className="mt-4" variant="destructive">
        <PhoneOff className="mr-2 h-4 w-4" /> End Conversation
      </Button>
    </div>
  )
}